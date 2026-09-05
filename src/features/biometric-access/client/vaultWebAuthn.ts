"use client";

import { decodeBytes, encodeBytes, randomBytes, VaultError } from "./vaultCrypto";

export type VaultContext = Readonly<{ origin: string; rpId: string }>;

export function requireVaultContext(ceremony = true): VaultContext {
  if (typeof window === "undefined" || !window.isSecureContext || window.top !== window.self) throw new VaultError("unavailable");
  const { origin, hostname, protocol } = window.location;
  const local = process.env.NODE_ENV !== "production"
    && ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
    && ["http:", "https:"].includes(protocol);
  if (!local && origin !== "https://impulsamovil.onrender.com") throw new VaultError("unavailable");
  if (!window.crypto?.subtle) throw new VaultError("unavailable");
  if (ceremony && (!navigator.onLine || typeof window.PublicKeyCredential === "undefined"
    || typeof navigator.credentials?.create !== "function" || typeof navigator.credentials?.get !== "function")) {
    throw new VaultError("unavailable");
  }
  return { origin, rpId: hostname };
}

function asBytes(value: unknown, minimum: number, maximum: number): Uint8Array<ArrayBuffer> {
  let bytes: Uint8Array<ArrayBuffer>;
  if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
  else if (ArrayBuffer.isView(value)) bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
  else throw new VaultError("invalid");
  if (bytes.length < minimum || bytes.length > maximum) throw new VaultError("invalid");
  return bytes;
}

function publicCredential(value: Credential | null): PublicKeyCredential {
  if (!value || value.type !== "public-key" || typeof (value as PublicKeyCredential).getClientExtensionResults !== "function") {
    throw new VaultError("invalid");
  }
  const credential = value as PublicKeyCredential;
  const rawId = asBytes(credential.rawId, 1, 1023);
  if (credential.id !== encodeBytes(rawId)) throw new VaultError("invalid");
  return credential;
}

async function validateResponse(credential: PublicKeyCredential, context: VaultContext, challenge: Uint8Array<ArrayBuffer>, operation: "webauthn.create" | "webauthn.get"): Promise<void> {
  const encoded = asBytes(credential.response.clientDataJSON, 1, 16_384);
  let data: Record<string, unknown>;
  try { data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(encoded)); } catch { throw new VaultError("invalid"); }
  if (!data || data.type !== operation || data.challenge !== encodeBytes(challenge)
    || data.origin !== context.origin || (data.crossOrigin !== undefined && data.crossOrigin !== false)
    || data.topOrigin !== undefined) throw new VaultError("invalid");
  const response = credential.response;
  const authenticatorData = operation === "webauthn.create"
    ? (response as AuthenticatorAttestationResponse).getAuthenticatorData?.()
    : (response as AuthenticatorAssertionResponse).authenticatorData;
  if (!authenticatorData) throw new VaultError("unavailable");
  const auth = asBytes(authenticatorData, 37, 16_384);
  const expectedRpHash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(context.rpId)));
  if (!expectedRpHash.every((byte, index) => auth[index] === byte) || (auth[32] & 0x05) !== 0x05) throw new VaultError("invalid");
  if (operation === "webauthn.create" && (auth[32] & 0x40) === 0) throw new VaultError("invalid");
}

export async function createPrfCredential(context: VaultContext, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  const challenge = randomBytes(32);
  const credential = publicCredential(await navigator.credentials.create({
    signal,
    publicKey: {
      challenge, rp: { id: context.rpId, name: "Impúlsate Móvil · Prueba" },
      user: { id: randomBytes(32), name: "Acceso local Impúlsate", displayName: "Acceso local Impúlsate" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
      attestation: "none", timeout: 60_000, extensions: { prf: {} },
    },
  }));
  signal.throwIfAborted();
  if (credential.authenticatorAttachment !== "platform" || credential.getClientExtensionResults().prf?.enabled !== true) {
    throw new VaultError("unavailable");
  }
  await validateResponse(credential, context, challenge, "webauthn.create");
  signal.throwIfAborted();
  return credential.id;
}

export async function evaluatePrf(context: VaultContext, credentialId: string, salt: string, signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  signal.throwIfAborted();
  const challenge = randomBytes(32);
  const credential = publicCredential(await navigator.credentials.get({
    signal, publicKey: {
      challenge, rpId: context.rpId, userVerification: "required", timeout: 60_000,
      allowCredentials: [{ type: "public-key", id: decodeBytes(credentialId, 1, 1023), transports: ["internal"] }],
      extensions: { prf: { eval: { first: decodeBytes(salt, 32) } } },
    },
  }));
  signal.throwIfAborted();
  if (credential.id !== credentialId) throw new VaultError("invalid");
  await validateResponse(credential, context, challenge, "webauthn.get");
  const first = credential.getClientExtensionResults().prf?.results?.first;
  if (!first) throw new VaultError("unavailable");
  let secret: Uint8Array<ArrayBuffer>;
  try { secret = asBytes(first, 32, 32).slice(); } catch { throw new VaultError("unavailable"); }
  // PRF output is a local key source, never serialize the credential or send it to a server.
  asBytes(first, 32, 32).fill(0);
  if (signal.aborted) { secret.fill(0); signal.throwIfAborted(); }
  return secret;
}
