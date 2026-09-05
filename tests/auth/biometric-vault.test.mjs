import "./support/server-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { webcrypto } from "node:crypto";
const { createVault, deleteVault, hasVault, unlockVault, VaultError } = await import("../../src/features/biometric-access/client/vault.ts");
const { decodeBytes, encodeBytes, parseVaultRecord } = await import("../../src/features/biometric-access/client/vaultCrypto.ts");

const originalGlobals = new Map(["window", "navigator", "indexedDB", "crypto"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
const originalEnvironment = process.env.NODE_ENV;
const encoder = new TextEncoder();
const credentials = { identifier: "test@example.com", password: "Sandbox-password-1!" };
const signal = () => new AbortController().signal;
const isFailure = (type) => (error) => error instanceof VaultError && error.type === type;

afterEach(() => {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  if (originalEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnvironment;
});

function runtime() {
  process.env.NODE_ENV = "test";
  const records = new Map();
  const created = [];
  const requested = [];
  const settings = { enabled: true, flags: 5, prfLength: 32, failWrite: false };
  const authenticatorSecret = new Uint8Array(32).fill(7);
  const credentialId = new Uint8Array(32).fill(9);
  const page = {
    isSecureContext: true, crypto: webcrypto, PublicKeyCredential: class {},
    location: { origin: "http://localhost:3000", hostname: "localhost", protocol: "http:" },
  };
  page.top = page.self = page;
  async function publicCredential(options, creating) {
    const challenge = options.publicKey.challenge;
    const auth = new Uint8Array(creating ? 60 : 37);
    auth.set(new Uint8Array(await webcrypto.subtle.digest("SHA-256", encoder.encode(options.publicKey.rp?.id ?? options.publicKey.rpId))));
    auth[32] = settings.flags | (creating ? 64 : 0);
    const clientDataJSON = encoder.encode(JSON.stringify({
      type: creating ? "webauthn.create" : "webauthn.get",
      challenge: settings.challenge ?? encodeBytes(new Uint8Array(challenge)),
      origin: settings.origin ?? page.location.origin, crossOrigin: settings.crossOrigin ?? false,
    })).buffer;
    const prf = {};
    if (creating) prf.enabled = settings.enabled;
    else if (!settings.omitPrf) {
      const material = await webcrypto.subtle.importKey("raw", authenticatorSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const result = new Uint8Array(await webcrypto.subtle.sign("HMAC", material, options.publicKey.extensions.prf.eval.first));
      prf.results = { first: result.slice(0, settings.prfLength).buffer };
    }
    return {
      type: "public-key", id: settings.credentialId ?? encodeBytes(credentialId), rawId: credentialId.slice().buffer,
      authenticatorAttachment: "platform",
      response: { clientDataJSON, authenticatorData: auth.buffer, getAuthenticatorData: () => auth.buffer },
      getClientExtensionResults: () => ({ prf }),
    };
  }
  const nav = {
    onLine: true,
    credentials: {
      async create(options) {
        created.push(options);
        if (settings.createError) throw settings.createError;
        await settings.waitCreate;
        return publicCredential(options, true);
      },
      async get(options) {
        requested.push(options);
        if (settings.getError) throw settings.getError;
        const value = await publicCredential(options, false);
        settings.afterGet?.();
        return value;
      },
    },
  };
  const database = {
    objectStoreNames: { contains: () => true }, close() {},
    transaction(_store, mode) {
      const tx = { oncomplete: null, onerror: null, onabort: null };
      let aborted = false;
      tx.abort = () => { aborted = true; queueMicrotask(() => tx.onabort?.()); };
      function request(operation, key, value) {
        const req = {};
        setTimeout(() => {
          if (aborted) return;
          if (settings.failWrite && mode === "readwrite") { tx.onerror?.(); return; }
          if (operation === "put") records.set(key, structuredClone(value));
          if (operation === "delete") records.delete(key);
          if (operation === "get") req.result = structuredClone(records.get(key));
          tx.oncomplete?.();
        }, 0);
        return req;
      }
      tx.objectStore = () => ({ get: (key) => request("get", key), put: (value, key) => request("put", key, value), delete: (key) => request("delete", key) });
      return tx;
    },
  };
  const indexedDb = {
    open() { const req = { result: database }; queueMicrotask(() => req.onsuccess?.()); return req; },
  };
  for (const [name, value] of Object.entries({ window: page, navigator: nav, indexedDB: indexedDb, crypto: webcrypto })) {
    Object.defineProperty(globalThis, name, { value, configurable: true });
  }
  return { records, created, requested, settings, page, nav, authenticatorSecret };
}

test("PRF vault encrypts the account and password; persists no plaintext, PRF key or token", async () => {
  const env = runtime();
  assert.equal(await hasVault(), false);
  await createVault(` ${credentials.identifier.toUpperCase()} `, credentials.password, signal());
  assert.equal(await hasVault(), true);
  assert.equal(env.created.length, 1);
  assert.equal(env.requested.length, 1);
  const record = env.records.get("current");
  assert.deepEqual(Object.keys(record).sort(), ["ciphertext", "credentialId", "iv", "kdfSalt", "origin", "prfSalt", "rpId", "version"].sort());
  const stored = JSON.stringify(record);
  assert.equal(stored.includes(credentials.identifier), false);
  assert.equal(stored.includes(credentials.password), false);
  assert.equal(stored.includes(encodeBytes(env.authenticatorSecret)), false);
  assert.equal(stored.includes("token"), false);
  assert.equal(decodeBytes(record.iv, 12).length, 12);
  assert.notEqual(record.prfSalt, record.kdfSalt);
  assert.deepEqual(await unlockVault(signal()), credentials);
  assert.equal(env.requested.length, 2);
});

test("creation and unlock use required user verification, random challenge/handle and generic device labels", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  await unlockVault(signal());
  const create = env.created[0].publicKey;
  assert.equal(create.authenticatorSelection.userVerification, "required");
  assert.equal(create.authenticatorSelection.authenticatorAttachment, "platform");
  assert.equal(create.attestation, "none");
  assert.equal(create.user.id.byteLength, 32);
  assert.equal(JSON.stringify(create).includes(credentials.identifier), false);
  assert.deepEqual(create.extensions, { prf: {} });
  const [first, second] = env.requested.map((request) => request.publicKey);
  assert.equal(first.userVerification, "required");
  assert.equal(first.allowCredentials.length, 1);
  assert.equal(first.rpId, "localhost");
  assert.notDeepEqual(first.challenge, second.challenge);
  assert.notDeepEqual(create.challenge, first.challenge);
  assert.deepEqual(first.extensions.prf.eval.first, second.extensions.prf.eval.first);
});

test("PRF absent or disabled aborts registration without persistence or fallback key", async () => {
  const env = runtime();
  env.settings.enabled = false;
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  assert.equal(env.records.size, 0);
  assert.equal(env.requested.length, 0);
});

test("PRF enabled is insufficient: an actual 32-byte get result must exist before persistence", async () => {
  const env = runtime();
  env.settings.omitPrf = true;
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  assert.equal(env.records.size, 0);
  env.settings.omitPrf = false;
  env.settings.prfLength = 31;
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  assert.equal(env.records.size, 0);
});

for (const flags of [0, 1, 4]) {
  test(`rejects authenticator flags ${flags} without both user presence and verification`, async () => {
    const env = runtime();
    env.settings.flags = flags;
    await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("invalid"));
    assert.equal(env.records.size, 0);
  });
}

for (const [key, value] of [["origin", "https://other.example"], ["challenge", "wrong"], ["crossOrigin", true], ["credentialId", "wrong"]]) {
  test(`rejects mismatched WebAuthn ${key}`, async () => {
    const env = runtime();
    env.settings[key] = value;
    await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("invalid"));
    assert.equal(env.records.size, 0);
  });
}

test("tampered ciphertext and metadata never produce plaintext", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  const original = structuredClone(env.records.get("current"));
  for (const field of ["ciphertext", "iv", "kdfSalt", "prfSalt"]) {
    const record = structuredClone(original);
    const bytes = decodeBytes(record[field], 1, 20_000);
    bytes[0] ^= 1;
    record[field] = encodeBytes(bytes);
    env.records.set("current", record);
    await assert.rejects(unlockVault(signal()), isFailure("invalid"));
  }
  env.records.set("current", { ...original, password: credentials.password });
  await assert.rejects(hasVault(), isFailure("invalid"));
});

test("vault cannot be moved to another allowed origin or RP", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  env.page.location = { origin: "https://impulsamovil.onrender.com", hostname: "impulsamovil.onrender.com", protocol: "https:" };
  await assert.rejects(unlockVault(signal()), isFailure("invalid"));
  assert.equal(env.requested.length, 1);
});

test("wrong authenticator PRF output cannot decrypt an existing vault", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  env.authenticatorSecret.fill(8);
  await assert.rejects(unlockVault(signal()), isFailure("invalid"));
});

test("cancelled activation preserves an existing vault and cancellation remains nontechnical", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  const original = structuredClone(env.records.get("current"));
  const cancelled = new DOMException("Device cancelled", "NotAllowedError");
  env.settings.getError = cancelled;
  await assert.rejects(createVault(credentials.identifier, "Another password", signal()), (error) => error === cancelled);
  assert.deepEqual(env.records.get("current"), original);
});

test("already aborted request never invokes credentials API", async () => {
  const env = runtime();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createVault(credentials.identifier, credentials.password, controller.signal), { name: "AbortError" });
  assert.equal(env.created.length, 0);
});

test("abort immediately after PRF returns prevents replacement of existing ciphertext", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  const original = structuredClone(env.records.get("current"));
  const controller = new AbortController();
  env.settings.afterGet = () => controller.abort();
  await assert.rejects(createVault(credentials.identifier, "Replacement password", controller.signal), { name: "AbortError" });
  assert.deepEqual(env.records.get("current"), original);
});

test("failed storage transaction preserves prior ciphertext", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  const original = structuredClone(env.records.get("current"));
  env.settings.failWrite = true;
  await assert.rejects(createVault(credentials.identifier, "Replacement password", signal()), isFailure("storage"));
  assert.deepEqual(env.records.get("current"), original);
});

test("concurrent calls are refused; no duplicate platform ceremonies", async () => {
  const env = runtime();
  let resume;
  env.settings.waitCreate = new Promise((resolve) => { resume = resolve; });
  const first = createVault(credentials.identifier, credentials.password, signal());
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("busy"));
  resume();
  await first;
  assert.equal(env.created.length, 1);
});

test("cross-tab Web Lock contention fails instead of overlapping credential operations", async () => {
  const env = runtime();
  env.nav.locks = { request: async (_name, options, callback) => { assert.equal(options.ifAvailable, true); return callback(null); } };
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("busy"));
  assert.equal(env.created.length, 0);
});

test("missing vault never prompts and local removal does not affect server sessions", async () => {
  const env = runtime();
  await assert.rejects(unlockVault(signal()), isFailure("missing"));
  assert.equal(env.requested.length, 0);
  await createVault(credentials.identifier, credentials.password, signal());
  await deleteVault();
  assert.equal(await hasVault(), false);
  assert.equal(env.records.size, 0);
});

test("insecure, offline, iframe, unsupported and non-sandbox origins are rejected before any prompt", async () => {
  const env = runtime();
  env.page.isSecureContext = false;
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  env.page.isSecureContext = true;
  env.nav.onLine = false;
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  env.nav.onLine = true;
  env.page.top = {};
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  env.page.top = env.page;
  const PublicKeyCredential = env.page.PublicKeyCredential;
  delete env.page.PublicKeyCredential;
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  env.page.PublicKeyCredential = PublicKeyCredential;
  env.page.location = { origin: "https://production.example", hostname: "production.example", protocol: "https:" };
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  assert.equal(env.created.length, 0);
});

test("production builds permit only the explicit sandbox host, not localhost", async () => {
  const env = runtime();
  process.env.NODE_ENV = "production";
  await assert.rejects(createVault(credentials.identifier, credentials.password, signal()), isFailure("unavailable"));
  env.page.location = { origin: "https://impulsamovil.onrender.com", hostname: "impulsamovil.onrender.com", protocol: "https:" };
  await createVault(credentials.identifier, credentials.password, signal());
  assert.deepEqual(await unlockVault(signal()), credentials);
});

test("invalid credentials and excessive vault payloads fail without changing normal password policy", async () => {
  const env = runtime();
  for (const [identifier, password] of [["", "password"], ["invalid", "password"], [credentials.identifier, ""], [credentials.identifier, "x".repeat(20_000)]]) {
    await assert.rejects(createVault(identifier, password, signal()), isFailure("invalid"));
  }
  assert.equal(env.created.length, 0);
});

test("strict record parser rejects unknown versions, oversized values and noncanonical encodings", async () => {
  const env = runtime();
  await createVault(credentials.identifier, credentials.password, signal());
  const record = env.records.get("current");
  for (const mutated of [{ ...record, version: 2 }, { ...record, iv: record.iv + "=" }, { ...record, ciphertext: "A".repeat(100_000) }, { ...record, credentialId: "" }, null, []]) {
    assert.throws(() => parseVaultRecord(mutated, record.origin, record.rpId), isFailure("invalid"));
  }
});
