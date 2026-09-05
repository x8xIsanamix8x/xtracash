import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../../public/sw.js", import.meta.url), "utf8");
function runtime(offline = false) {
  const handlers = new Map();
  const calls = [];
  runInNewContext(source, {
    URL, Response,
    self: { location: { origin: "https://app.example.test" }, addEventListener: (name, handler) => handlers.set(name, handler) },
    caches: { open() { throw new Error("Authentication must never open cache"); },
      match() { throw new Error("Authentication must never read offline fallback"); } },
    fetch: async (request, init) => {
      calls.push({ request, init });
      if (offline) throw new TypeError("offline");
      return new Response(null, { status: 204 });
    },
  });
  return { calls, dispatch(url, method = "GET") {
    let promise;
    handlers.get("fetch")({ request: { url, method, mode: "navigate", headers: new Headers() },
      respondWith(value) { promise = value; } });
    return promise;
  } };
}

test("API and credential-bearing requests are network-only with no cache reads or writes", async () => {
  for (const path of ["/api/auth/session", "/api/profile/personal-info",
    "/icons/icon-192.png?access_token=test", "/?password=test"]) {
    const r = runtime();
    assert.equal((await r.dispatch(`https://app.example.test${path}`)).status, 204);
    assert.equal(r.calls.length, 1); assert.equal(r.calls[0].init.cache, "no-store");
  }
});

test("offline API fails without an offline shell or cached success", async () => {
  const r = runtime(true);
  await assert.rejects(r.dispatch("https://app.example.test/api/auth/session"), /offline/);
});

test("external requests and login POST are never intercepted or stored by app SW", () => {
  const r = runtime();
  assert.equal(r.dispatch("https://external.example.test/api"), undefined);
  assert.equal(r.dispatch("https://app.example.test/api/auth/login", "POST"), undefined);
  assert.equal(r.calls.length, 0);
});
