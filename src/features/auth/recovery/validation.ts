const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f]/u;

export const RECOVERY_IDENTIFIER_MAX_LENGTH = 254;

export const normalizeRecoveryIdentifier = (identifier: string) =>
  identifier.trim();

export function validateRecoveryIdentifier(identifier: string) {
  if (controlCharacterPattern.test(identifier)) {
    return "Ingresa un correo electrónico válido.";
  }

  const value = normalizeRecoveryIdentifier(identifier);

  if (!value) {
    return "Ingresa tu correo electrónico.";
  }

  return value.length <= RECOVERY_IDENTIFIER_MAX_LENGTH && emailPattern.test(value)
    ? ""
    : "Ingresa un correo electrónico válido.";
}

export function parseRecoveryRequest(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const identifier = (value as Record<string, unknown>).identifier;
  if (typeof identifier !== "string" || validateRecoveryIdentifier(identifier)) {
    return null;
  }

  return { identifier: normalizeRecoveryIdentifier(identifier) } as const;
}

export type ParsedRecoveryApiRequest =
  | Readonly<{ kind: "profile" }>
  | Readonly<{
    kind: "public";
    request: Readonly<{ identifier: string }>;
  }>;

export function parseRecoveryApiRequest(value: unknown): ParsedRecoveryApiRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate);

  if (keys.length === 1 && candidate.source === "profile") {
    return { kind: "profile" };
  }

  if (keys.length !== 1 || !("identifier" in candidate)) return null;
  const request = parseRecoveryRequest(candidate);
  return request === null ? null : { kind: "public", request };
}

export function parseCoreRecoveryResponse(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const message = (value as Record<string, unknown>).message;
  if (typeof message !== "string" || !message.trim()) return null;

  return { message } as const;
}

export function createCoreRecoveryEndpoint(baseUrl: string): string {
  return new URL("/api/recuperacion", `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

export function isSuccessfulRecoveryStatus(status: number): boolean {
  return status === 200 || status === 202;
}
