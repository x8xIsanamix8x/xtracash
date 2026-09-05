export function isBiometricPrototypeOriginAllowed(origin: string, development: boolean): boolean {
  try {
    const url = new URL(origin);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return false;
    if (url.origin === "https://impulsamovil.onrender.com") return true;
    return development && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      && ["http:", "https:"].includes(url.protocol);
  } catch { return false; }
}

export function isBiometricPrototypeBrowserAllowed(): boolean {
  return typeof window !== "undefined"
    && window.isSecureContext
    && isBiometricPrototypeOriginAllowed(window.location.origin, process.env.NODE_ENV === "development");
}
