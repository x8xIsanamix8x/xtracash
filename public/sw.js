const CACHE_PREFIX = "impulsate-pwa";
const CACHE_VERSION = "v2";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const MAX_RUNTIME_ENTRIES = 60;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

function canStore(request, response) {
  if (!response || !response.ok) return false;
  if (request.headers.has("Authorization")) return false;

  const cacheControl = response.headers.get("Cache-Control") ?? "";
  return !/no-store|private/i.test(cacheControl)
    && response.headers.get("Set-Cookie") === null;
}

function isPublicRuntimeAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/icons/")) return true;

  return /\.(?:css|js|woff2?|png|jpe?g|webp|avif|svg|ico)$/i.test(
    url.pathname,
  );
}

function isBiometricRoute(url) {
  return /\/(?:biometric|webauthn|passkeys?)(?:\/|$)/i.test(url.pathname);
}

function containsSensitiveParameters(url) {
  return ["access_token", "id_token", "refresh_token", "password", "identifier"]
    .some((name) => url.searchParams.has(name));
}

async function trimRuntimeCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_RUNTIME_ENTRIES;
  if (excess <= 0) return;

  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}

async function storeRuntimeAsset(cache, request, response) {
  if (!canStore(request, response)) return;
  await cache.put(request, response.clone());
  await trimRuntimeCache(cache);
}

async function precacheOfflineShell() {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(PRECACHE_URLS);

  const offlineResponse = await cache.match(OFFLINE_URL);
  if (!offlineResponse) return;

  const html = await offlineResponse.text();
  const versionedAssets = [...html.matchAll(
    /<(?:script|link)\b[^>]*(?:src|href)="(\/_next\/static\/[A-Za-z0-9._~/-]+)"/gi,
  )]
    .map((match) => match[1])
    .filter(Boolean);

  await cache.addAll([...new Set(versionedAssets)]);
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await storeRuntimeAsset(cache, request, response);
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      await storeRuntimeAsset(cache, request, response);
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return await network ?? Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheOfflineShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(`${CACHE_PREFIX}-`))
        .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isBiometricRoute(url) || containsSensitiveParameters(url)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (
        await caches.match(OFFLINE_URL)
        ?? Response.error()
      )),
    );
    return;
  }

  if (!isPublicRuntimeAsset(url) && url.pathname !== "/manifest.webmanifest") {
    return;
  }

  event.respondWith(
    url.pathname.startsWith("/_next/static/")
      ? cacheFirst(request)
      : staleWhileRevalidate(request, event),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
