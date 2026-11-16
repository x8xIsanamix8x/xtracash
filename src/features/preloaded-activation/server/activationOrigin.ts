/**
 * Compara el origen del navegador con el host público. No usa `request.url`: detrás del balanceador
 * trae la dirección interna del servidor y ninguna petición real coincidiría con ella.
 */
export function matchesPublicHost(
  origin: string | null,
  forwardedHost: string | null,
  host: string | null,
): boolean {
  if (!origin) return true;
  const publicHost = (forwardedHost ?? host)?.split(",")[0].trim();
  if (!publicHost) return false;
  try {
    return new URL(origin).host === publicHost;
  } catch {
    return false;
  }
}
