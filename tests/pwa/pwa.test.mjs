import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import manifest from "../../src/app/manifest.ts";
import {
  canRegisterServiceWorker,
  detectIosSafari,
  getInstallAvailability,
} from "../../src/features/pwa/runtime.ts";

const projectUrl = new URL("../../", import.meta.url);

async function readPngSize(pathname) {
  const bytes = await readFile(new URL(pathname, projectUrl));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

test("expone un único manifest instalable con inicio seguro en la raíz", () => {
  const value = manifest();

  assert.equal(value.name, "Impúlsate Móvil");
  assert.equal(value.short_name, "Impúlsate");
  assert.equal(value.id, "/");
  assert.equal(value.start_url, "/");
  assert.equal(value.scope, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.background_color, "#F4F5FA");
  assert.equal(value.theme_color, "#02004D");
  assert.equal(value.orientation, undefined);
  assert.deepEqual(value.categories, ["finance"]);
  assert.deepEqual(
    value.icons?.map(({ sizes, purpose }) => ({ sizes, purpose })),
    [
      { sizes: "192x192", purpose: "any" },
      { sizes: "512x512", purpose: "any" },
      { sizes: "192x192", purpose: "maskable" },
      { sizes: "512x512", purpose: "maskable" },
    ],
  );
});

test("los iconos declarados existen con sus dimensiones exactas", async () => {
  const expected = [
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/icons/icon-maskable-192.png", 192],
    ["public/icons/icon-maskable-512.png", 512],
    ["public/icons/apple-touch-icon.png", 180],
    ["public/icons/favicon-32.png", 32],
    ["public/icons/favicon-16.png", 16],
  ];

  for (const [pathname, size] of expected) {
    assert.deepEqual(await readPngSize(pathname), { width: size, height: size });
  }
});

test("registra el Service Worker solo en producción y contextos seguros", () => {
  assert.equal(canRegisterServiceWorker({
    hostname: "impulsa.vc",
    isProduction: true,
    isSecureContext: true,
    serviceWorkerSupported: true,
  }), true);
  assert.equal(canRegisterServiceWorker({
    hostname: "localhost",
    isProduction: true,
    isSecureContext: false,
    serviceWorkerSupported: true,
  }), true);
  assert.equal(canRegisterServiceWorker({
    hostname: "localhost",
    isProduction: false,
    isSecureContext: true,
    serviceWorkerSupported: true,
  }), false);
  assert.equal(canRegisterServiceWorker({
    hostname: "impulsa.vc",
    isProduction: true,
    isSecureContext: false,
    serviceWorkerSupported: true,
  }), false);
});

test("distingue instalación programática, instrucciones iOS y standalone", () => {
  assert.equal(getInstallAvailability({
    isIosSafari: false,
    isStandalone: false,
    promptAvailable: true,
  }), "prompt");
  assert.equal(getInstallAvailability({
    isIosSafari: true,
    isStandalone: false,
    promptAvailable: false,
  }), "ios");
  assert.equal(getInstallAvailability({
    isIosSafari: true,
    isStandalone: true,
    promptAvailable: true,
  }), "installed");
  assert.equal(
    detectIosSafari(
      "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1",
      "iPhone",
      5,
    ),
    true,
  );
  assert.equal(
    detectIosSafari(
      "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/126 Mobile Safari/604.1",
      "iPhone",
      5,
    ),
    false,
  );
});

test("el Service Worker excluye APIs, mutaciones y datos privados del caché", async () => {
  const source = await readFile(new URL("public/sw.js", projectUrl), "utf8");
  const precache = source.slice(
    source.indexOf("const PRECACHE_URLS"),
    source.indexOf("function canStore"),
  );

  assert.match(source, /request\.method !== "GET"/);
  assert.match(source, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(source, /no-store\|private/i);
  assert.match(source, /response\.headers\.get\("Set-Cookie"\)/);
  assert.match(source, /request\.headers\.has\("Authorization"\)/);
  assert.match(source, /request\.mode === "navigate"/);
  assert.match(source, /await caches\.match\(OFFLINE_URL\)/);
  assert.match(source, /MAX_RUNTIME_ENTRIES = 60/);
  assert.match(source, /<\(\?:script\|link\)/);
  assert.doesNotMatch(precache, /\/api\//);
  assert.doesNotMatch(precache, /\/home|\/profile|\/movements|\/mobile-payment/);
});
