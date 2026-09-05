import "server-only";
import { isBiometricAccessFeatureEnabled, isBiometricPrototypeOriginAllowed } from "../config";

/** Never enable the reversible-password prototype against production Core or arbitrary hosts. */
export function isBiometricPrototypeEnabled(host: string | null, env = process.env): boolean {
  if (!host || !isBiometricAccessFeatureEnabled(env.NEXT_PUBLIC_BIOMETRIC_ACCESS_ENABLED)) return false;
  try {
    const core = new URL(env.CORE_API_URL ?? "");
    if (core.origin !== "https://core-api.sandbox.impulsa.vc" || core.pathname !== "/"
      || core.username || core.password || core.search || core.hash) return false;
    const development = env.NODE_ENV === "development";
    return isBiometricPrototypeOriginAllowed(`${development ? "http" : "https"}://${host}`, development)
      || (host === "impulsamovil.onrender.com");
  } catch { return false; }
}
