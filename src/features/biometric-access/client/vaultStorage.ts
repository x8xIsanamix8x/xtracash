"use client";

import { VaultError, type VaultRecord } from "./vaultCrypto";

const DATABASE = "impulsate-biometric-vault-sandbox-v1";
const STORE = "vault";
const RECORD_KEY = "current";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new VaultError("storage"));
    const request = indexedDB.open(DATABASE, 1);
    let settled = false;
    const fail = () => { settled = true; reject(new VaultError("storage")); };
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onerror = fail;
    request.onblocked = fail;
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}

async function transact(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest, signal?: AbortSignal): Promise<unknown> {
  signal?.throwIfAborted();
  const database = await openDatabase();
  try {
    signal?.throwIfAborted();
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const abort = () => { try { transaction.abort(); } catch { /* Already completed. */ } };
      const cleanup = () => signal?.removeEventListener("abort", abort);
      signal?.addEventListener("abort", abort, { once: true });
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => { cleanup(); resolve(request.result); };
      transaction.onerror = transaction.onabort = () => {
        cleanup();
        reject(signal?.aborted ? signal.reason : new VaultError("storage"));
      };
      if (signal?.aborted) abort();
    });
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    if (error instanceof VaultError) throw error;
    throw new VaultError("storage");
  } finally {
    database.close();
  }
}

export function readVaultRecord(): Promise<unknown> {
  return transact("readonly", (store) => store.get(RECORD_KEY));
}

export async function writeVaultRecord(record: VaultRecord, signal: AbortSignal): Promise<void> {
  // One transaction replaces the old vault only on successful commit.
  await transact("readwrite", (store) => store.put(record, RECORD_KEY), signal);
}

export async function removeVaultRecord(): Promise<void> {
  await transact("readwrite", (store) => store.delete(RECORD_KEY));
}
