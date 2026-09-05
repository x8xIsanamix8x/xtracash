import "./support/server-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { createBiometricVaultService, BiometricPrototypeError, clearEnrollmentCredentials } = await import("../../src/features/biometric-access/client/vaultService.ts");
const { isBiometricPrototypeEnabled } = await import("../../src/features/biometric-access/server/prototypeConfiguration.ts");
const { isBiometricPrototypeOriginAllowed } = await import("../../src/features/biometric-access/config.ts");
const { login, LoginServiceError } = await import("../../src/features/auth/login/services/login.ts");

const signal = () => new AbortController().signal;
function fixture(overrides = {}) {
  const calls = [];
  let now = 0;
  const deps = {
    guard() {}, now: () => now,
    profile: async () => { calls.push("profile"); return { email: " Test@Example.com " }; },
    login: async (credentials) => { calls.push(["login", { ...credentials }]); },
    create: async (identifier, password) => { calls.push(["create", identifier, password]); },
    unlock: async () => { calls.push("unlock"); return { identifier: "test@example.com", password: "Test-1!" }; },
    has: async () => true, remove: async () => { calls.push("remove"); }, ...overrides,
  };
  return { service: createBiometricVaultService(deps), calls, advance: () => { now += 120_001; } };
}
const prototypeError = (type) => (e) => e instanceof BiometricPrototypeError && e.type === type;

test("sandbox gate fails closed for disabled flag, production Core and unknown host", () => {
  const env = { NODE_ENV: "production", NEXT_PUBLIC_BIOMETRIC_ACCESS_ENABLED: "true", CORE_API_URL: "https://core-api.sandbox.impulsa.vc" };
  assert.equal(isBiometricPrototypeEnabled("impulsamovil.onrender.com", env), true);
  for (const host of [null, "localhost:3000", "production.impulsa.vc", "impulsamovil.onrender.com.evil.test", "user@impulsamovil.onrender.com"]) {
    assert.equal(isBiometricPrototypeEnabled(host, env), false);
  }
  for (const CORE_API_URL of ["", "https://core-api.impulsa.vc", "https://core-api.sandbox.impulsa.vc/path", "https://user:password@core-api.sandbox.impulsa.vc"]) {
    assert.equal(isBiometricPrototypeEnabled("impulsamovil.onrender.com", { ...env, CORE_API_URL }), false);
  }
  assert.equal(isBiometricPrototypeEnabled("impulsamovil.onrender.com", { ...env, NEXT_PUBLIC_BIOMETRIC_ACCESS_ENABLED: "false" }), false);
  assert.equal(isBiometricPrototypeEnabled("localhost:3000", { ...env, NODE_ENV: "development" }), true);
  assert.equal(isBiometricPrototypeOriginAllowed("https://impulsamovil.onrender.com/home", false), false);
  assert.equal(isBiometricPrototypeOriginAllowed("https://impulsamovil.onrender.com?secret=1", false), false);
});

test("profile verifies the server account and password before any passkey or persistence", async () => {
  const { service, calls } = fixture();
  const credentials = await service.verify("Test-1!", signal());
  assert.deepEqual(calls, ["profile", ["login", { identifier: "test@example.com", password: "Test-1!" }], "profile"]);
  await service.activate(credentials, signal());
  assert.deepEqual(calls.at(-1), ["create", "test@example.com", "Test-1!"]);
  assert.deepEqual(credentials, { identifier: "", password: "" });
  await assert.rejects(service.activate(credentials, signal()), prototypeError("expired"));
});

test("cannot enroll unverified, copied, altered or expired credentials", async () => {
  const { service, advance, calls } = fixture();
  await assert.rejects(service.activate({ identifier: "test@example.com", password: "x" }, signal()), prototypeError("expired"));
  const valid = await service.verify("Test-1!", signal());
  await assert.rejects(service.activate({ ...valid }, signal()), prototypeError("expired"));
  valid.password = "changed";
  await assert.rejects(service.activate(valid, signal()), prototypeError("expired"));
  const expired = await service.verify("Test-1!", signal());
  advance();
  await assert.rejects(service.activate(expired, signal()), prototypeError("expired"));
  assert.equal(calls.some((c) => c[0] === "create"), false);
});

test("failed password verification cannot create a vault or report enrollment success", async () => {
  const { service, calls } = fixture({ login: async () => { throw new LoginServiceError("invalidCredentials"); } });
  await assert.rejects(service.verify("wrong", signal()), (e) => e.type === "invalidCredentials");
  assert.deepEqual(calls, ["profile"]);
});

test("account change during verification fails before persistence", async () => {
  let count = 0;
  const { service } = fixture({ profile: async () => ({ email: ++count === 1 ? "a@example.com" : "b@example.com" }) });
  await assert.rejects(service.verify("Test-1!", signal()), prototypeError("account"));
});

test("biometric success calls normal login once and clears plaintext references", async () => {
  const credentials = { identifier: "test@example.com", password: "Test-1!" };
  const { service, calls } = fixture({ unlock: async () => credentials });
  await service.authenticate(signal());
  assert.deepEqual(calls, [["login", { identifier: "test@example.com", password: "Test-1!" }]]);
  assert.deepEqual(credentials, { identifier: "", password: "" });
});

for (const type of ["invalidCredentials", "network", "server"]) {
  test(`Core ${type} is not successful authentication and does not remove the stored vault`, async () => {
    const credentials = { identifier: "test@example.com", password: "Test-1!" };
    const { service, calls } = fixture({ unlock: async () => credentials, login: async () => { throw new LoginServiceError(type); } });
    await assert.rejects(service.authenticate(signal()), (e) => e.type === type);
    assert.deepEqual(credentials, { identifier: "", password: "" });
    assert.equal(calls.includes("remove"), false);
  });
}

test("cancelled platform ceremony never submits a password", async () => {
  const { service, calls } = fixture({ unlock: async () => { throw new DOMException("", "NotAllowedError"); } });
  await assert.rejects(service.authenticate(signal()), (e) => e.name === "NotAllowedError");
  assert.deepEqual(calls, []);
});

test("abort after unlock clears password and never starts login", async () => {
  const controller = new AbortController();
  const credentials = { identifier: "test@example.com", password: "Test-1!" };
  const { service, calls } = fixture({ unlock: async () => { controller.abort(); return credentials; } });
  await assert.rejects(service.authenticate(controller.signal), (e) => e.name === "AbortError");
  assert.deepEqual(credentials, { identifier: "", password: "" });
  assert.deepEqual(calls, []);
});

test("only one integration action may be in flight; no duplicate login", async () => {
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  const { service, calls } = fixture({ unlock: async () => { await wait; return { identifier: "test@example.com", password: "Test-1!" }; } });
  const first = service.authenticate(signal());
  await assert.rejects(service.authenticate(signal()), prototypeError("busy"));
  release(); await first;
  assert.equal(calls.length, 1);
});

test("clear transient credentials and remove the local vault without logging out", async () => {
  const credentials = { identifier: "test@example.com", password: "Test-1!" };
  clearEnrollmentCredentials(credentials);
  assert.deepEqual(credentials, { identifier: "", password: "" });
  const { service, calls } = fixture();
  await service.deactivate();
  assert.deepEqual(calls, ["remove"]);
});

test("existing BFF login receives exactly identifier/password, same-origin and no-store", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response('{}', { status: 200 }); };
  try {
    const { service } = fixture({ login });
    await service.authenticate(signal());
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/auth/login");
    assert.equal(calls[0].init.cache, "no-store");
    assert.equal(calls[0].init.credentials, "same-origin");
    assert.deepEqual(JSON.parse(calls[0].init.body), { identifier: "test@example.com", password: "Test-1!" });
    assert.equal(calls[0].init.method, "POST");
  } finally { globalThis.fetch = originalFetch; }
});
