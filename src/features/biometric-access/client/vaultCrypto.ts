"use client";

import { normalizeLoginIdentifier, validateLogin } from "../../auth/login/validation";

export type VaultFailure = "unavailable" | "missing" | "invalid" | "storage" | "busy";

export class VaultError extends Error {
  constructor(readonly type: VaultFailure) {
    super(`Biometric vault: ${type}`);
    this.name = "VaultError";
  }
}

export type VaultCredentials = { identifier: string; password: string };
export type VaultMetadata = Readonly<{
  version: 1;
  origin: string;
  rpId: string;
  credentialId: string;
  prfSalt: string;
  kdfSalt: string;
  iv: string;
}>;
export type VaultRecord = VaultMetadata & Readonly<{ ciphertext: string }>;

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const MAX_PLAINTEXT_BYTES = 16_384;
const RECORD_FIELDS = ["version", "origin", "rpId", "credentialId", "prfSalt", "kdfSalt", "iv", "ciphertext"];

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function encodeBytes(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBytes(value: unknown, min: number, max = min): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || value.length > Math.ceil(max * 4 / 3) || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new VaultError("invalid");
  }
  try {
    const bytes = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (character) => character.charCodeAt(0));
    if (bytes.length < min || bytes.length > max || encodeBytes(bytes) !== value) throw new VaultError("invalid");
    return bytes;
  } catch {
    throw new VaultError("invalid");
  }
}

export function parseVaultRecord(value: unknown, origin: string, rpId: string): VaultRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new VaultError("invalid");
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).length !== RECORD_FIELDS.length || RECORD_FIELDS.some((key) => !Object.hasOwn(candidate, key))) {
    throw new VaultError("invalid");
  }
  if (candidate.version !== 1 || candidate.origin !== origin || candidate.rpId !== rpId) throw new VaultError("invalid");
  decodeBytes(candidate.credentialId, 1, 1023);
  decodeBytes(candidate.prfSalt, 32);
  decodeBytes(candidate.kdfSalt, 32);
  decodeBytes(candidate.iv, 12);
  decodeBytes(candidate.ciphertext, 17, MAX_PLAINTEXT_BYTES + 16);
  return candidate as VaultRecord;
}

export function normalizeVaultCredentials(identifier: string, password: string): VaultCredentials {
  if (typeof identifier !== "string" || typeof password !== "string") throw new VaultError("invalid");
  const credentials = { identifier: normalizeLoginIdentifier(identifier), password };
  if (Object.keys(validateLogin(credentials)).length !== 0) throw new VaultError("invalid");
  // A storage/resource bound for this prototype, not a new login password policy.
  if (encoder.encode(JSON.stringify(credentials)).byteLength > MAX_PLAINTEXT_BYTES) throw new VaultError("invalid");
  return credentials;
}

function additionalData(metadata: VaultMetadata): Uint8Array<ArrayBuffer> {
  return encoder.encode(JSON.stringify([
    "impulsate:ci325:password-vault:aes-gcm:v1", metadata.version, metadata.origin,
    metadata.rpId, metadata.credentialId, metadata.prfSalt, metadata.kdfSalt, metadata.iv,
  ]));
}

async function deriveKey(prfSecret: Uint8Array<ArrayBuffer>, metadata: VaultMetadata): Promise<CryptoKey> {
  if (prfSecret.byteLength !== 32) throw new VaultError("unavailable");
  const material = await crypto.subtle.importKey("raw", prfSecret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({
    name: "HKDF", hash: "SHA-256", salt: decodeBytes(metadata.kdfSalt, 32),
    info: encoder.encode(`impulsate:ci325:password-vault:key:v1:${metadata.origin}:${metadata.rpId}`),
  }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptVault(credentials: VaultCredentials, metadata: VaultMetadata, secret: Uint8Array<ArrayBuffer>): Promise<VaultRecord> {
  const plaintext = encoder.encode(JSON.stringify(normalizeVaultCredentials(credentials.identifier, credentials.password)));
  try {
    const key = await deriveKey(secret, metadata);
    const ciphertext = await crypto.subtle.encrypt({
      name: "AES-GCM", iv: decodeBytes(metadata.iv, 12), additionalData: additionalData(metadata), tagLength: 128,
    }, key, plaintext);
    return { ...metadata, ciphertext: encodeBytes(new Uint8Array(ciphertext)) };
  } finally {
    plaintext.fill(0);
    secret.fill(0);
  }
}

export async function decryptVault(record: VaultRecord, secret: Uint8Array<ArrayBuffer>): Promise<VaultCredentials> {
  let plaintext: Uint8Array<ArrayBuffer> | undefined;
  try {
    const key = await deriveKey(secret, record);
    plaintext = new Uint8Array(await crypto.subtle.decrypt({
      name: "AES-GCM", iv: decodeBytes(record.iv, 12), additionalData: additionalData(record), tagLength: 128,
    }, key, decodeBytes(record.ciphertext, 17, MAX_PLAINTEXT_BYTES + 16)));
    const candidate: unknown = JSON.parse(decoder.decode(plaintext));
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new VaultError("invalid");
    const data = candidate as Record<string, unknown>;
    if (Object.keys(data).length !== 2 || typeof data.identifier !== "string" || typeof data.password !== "string") throw new VaultError("invalid");
    return normalizeVaultCredentials(data.identifier, data.password);
  } catch {
    // Never expose WebCrypto errors or decrypted payloads to logs/UI.
    throw new VaultError("invalid");
  } finally {
    plaintext?.fill(0);
    secret.fill(0);
  }
}
