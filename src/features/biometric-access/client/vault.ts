"use client";

import { decryptVault, encryptVault, encodeBytes, normalizeVaultCredentials, parseVaultRecord, randomBytes, VaultError, type VaultCredentials } from "./vaultCrypto";
import { readVaultRecord, removeVaultRecord, writeVaultRecord } from "./vaultStorage";
import { createPrfCredential, evaluatePrf, requireVaultContext } from "./vaultWebAuthn";

export { VaultError } from "./vaultCrypto";
export type { VaultCredentials, VaultFailure } from "./vaultCrypto";

let active = false;

async function exclusively<T>(action: () => Promise<T>): Promise<T> {
  if (active) throw new VaultError("busy");
  active = true;
  try {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return await navigator.locks.request("impulsate-biometric-vault-sandbox", { ifAvailable: true }, async (lock) => {
        if (!lock) throw new VaultError("busy");
        return action();
      });
    }
    return await action();
  } finally { active = false; }
}

export async function createVault(identifier: string, password: string, signal: AbortSignal): Promise<void> {
  return exclusively(async () => {
    signal.throwIfAborted();
    const context = requireVaultContext();
    const credentials = normalizeVaultCredentials(identifier, password);
    const credentialId = await createPrfCredential(context, signal);
    const metadata = {
      version: 1 as const, ...context, credentialId,
      prfSalt: encodeBytes(randomBytes(32)), kdfSalt: encodeBytes(randomBytes(32)), iv: encodeBytes(randomBytes(12)),
    };
    // A second assertion proves PRF evaluation works before persisting anything.
    const secret = await evaluatePrf(context, credentialId, metadata.prfSalt, signal);
    const record = await encryptVault(credentials, metadata, secret);
    signal.throwIfAborted();
    requireVaultContext();
    await writeVaultRecord(record, signal);
  });
}

export async function unlockVault(signal: AbortSignal): Promise<VaultCredentials> {
  return exclusively(async () => {
    signal.throwIfAborted();
    const context = requireVaultContext();
    const stored = await readVaultRecord();
    signal.throwIfAborted();
    if (stored === undefined) throw new VaultError("missing");
    const record = parseVaultRecord(stored, context.origin, context.rpId);
    const secret = await evaluatePrf(context, record.credentialId, record.prfSalt, signal);
    const credentials = await decryptVault(record, secret);
    signal.throwIfAborted();
    requireVaultContext();
    // This return is NOT authentication: the caller must use the existing Core login.
    return credentials;
  });
}

export async function hasVault(): Promise<boolean> {
  const context = requireVaultContext(false);
  const stored = await readVaultRecord();
  if (stored === undefined) return false;
  parseVaultRecord(stored, context.origin, context.rpId);
  return true;
}

export async function deleteVault(): Promise<void> {
  requireVaultContext(false);
  await exclusively(removeVaultRecord);
  // Browsers do not expose a universal API to delete the passkey in the device manager.
}
