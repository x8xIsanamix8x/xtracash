"use client";

export type EnrollmentCredentials = { identifier: string; password: string };
type Dependencies = Readonly<{
  guard: () => void;
  now: () => number;
  profile: (signal: AbortSignal) => Promise<{ email: string }>;
  login: (credentials: EnrollmentCredentials, signal: AbortSignal) => Promise<void>;
  create: (identifier: string, password: string, signal: AbortSignal) => Promise<void>;
  unlock: (signal: AbortSignal) => Promise<EnrollmentCredentials>;
  has: () => Promise<boolean>;
  remove: () => Promise<void>;
}>;

export class BiometricPrototypeError extends Error {
  constructor(readonly type: "unavailable" | "busy" | "account" | "expired" | "password") {
    super(type);
    this.name = "BiometricPrototypeError";
  }
}

/** Clearing references is best effort, not guaranteed secure erasure in JavaScript. */
export function clearEnrollmentCredentials(credentials: EnrollmentCredentials | null): void {
  if (credentials) { credentials.identifier = ""; credentials.password = ""; }
}

export function createBiometricVaultService(deps: Dependencies) {
  const proofs = new WeakMap<EnrollmentCredentials, { identifier: string; password: string; expiresAt: number }>();
  let busy = false;
  async function exclusive<T>(action: () => Promise<T>): Promise<T> {
    deps.guard();
    if (busy) throw new BiometricPrototypeError("busy");
    busy = true;
    try { return await action(); } finally { busy = false; }
  }
  return {
    async verify(password: string, signal: AbortSignal): Promise<EnrollmentCredentials> {
      return exclusive(async () => {
        signal.throwIfAborted();
        if (!password) throw new BiometricPrototypeError("password");
        const before = await deps.profile(signal);
        const identifier = before.email.trim().toLowerCase();
        if (!identifier) throw new BiometricPrototypeError("account");
        const credentials = { identifier, password };
        try {
          signal.throwIfAborted();
          await deps.login(credentials, signal);
          const after = await deps.profile(signal);
          signal.throwIfAborted();
          if (after.email.trim().toLowerCase() !== identifier) throw new BiometricPrototypeError("account");
          proofs.set(credentials, { ...credentials, expiresAt: deps.now() + 120_000 });
          return credentials;
        } catch (error) { clearEnrollmentCredentials(credentials); throw error; }
      });
    },
    async activate(credentials: EnrollmentCredentials, signal: AbortSignal): Promise<void> {
      return exclusive(async () => {
        const proof = proofs.get(credentials);
        proofs.delete(credentials);
        try {
          signal.throwIfAborted();
          if (!proof || proof.expiresAt <= deps.now() || proof.identifier !== credentials.identifier
            || proof.password !== credentials.password) throw new BiometricPrototypeError("expired");
          // Separate explicit click after reauthentication preserves the browser user gesture.
          await deps.create(credentials.identifier, credentials.password, signal);
        } finally { clearEnrollmentCredentials(credentials); }
      });
    },
    async authenticate(signal: AbortSignal): Promise<void> {
      return exclusive(async () => {
        let credentials: EnrollmentCredentials | null = null;
        try {
          signal.throwIfAborted();
          credentials = await deps.unlock(signal);
          signal.throwIfAborted();
          deps.guard();
          // Only a real success from the existing BFF establishes the session.
          await deps.login(credentials, signal);
          signal.throwIfAborted();
        } finally { clearEnrollmentCredentials(credentials); }
      });
    },
    async has(): Promise<boolean> { deps.guard(); return deps.has(); },
    async deactivate(): Promise<void> { return exclusive(deps.remove); },
  };
}
