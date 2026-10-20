import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

export type MarketplaceCoreResult = Readonly<{ status: number; body: unknown }>;
export type MarketplaceImageResult = Readonly<{ status: number; body: ReadableStream<Uint8Array> | null; contentType: string }>;

export async function requestMarketplaceImage(
  accessToken: string,
  productId: string,
  imageId: string,
  signal: AbortSignal,
): Promise<MarketplaceImageResult> {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new Error("configuration");
  let response: Response;
  try {
    response = await fetch(`${configuration.baseUrl}/api/impulsate-movil/catalogo/${encodeURIComponent(productId)}/imagenes/${encodeURIComponent(imageId)}`, {
      cache: "no-store",
      signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error("network");
  }
  if (!response.ok) {
    let payload: unknown = null;
    try { payload = await response.json(); } catch { /* Se traduce a un error genérico sin filtrar el contenido. */ }
    const error = new Error("http") as Error & { status: number; body: unknown };
    error.status = response.status;
    error.body = payload;
    throw error;
  }
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  if (!contentType.startsWith("image/")) throw new Error("protocol");
  return { status: response.status, body: response.body, contentType };
}

export async function requestMarketplaceCore(
  accessToken: string,
  path: string,
  signal: AbortSignal,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<MarketplaceCoreResult> {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new Error("configuration");
  let response: Response;
  try {
    response = await fetch(`${configuration.baseUrl}/api/impulsate-movil/${path}`, {
      method,
      cache: "no-store",
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("network");
  }
  let payload: unknown = null;
  if (response.status !== 204) {
    try {
      payload = response.headers.get("content-type")?.includes("json")
        ? await response.json()
        : await response.text();
    } catch {
      throw new Error("protocol");
    }
  }
  if (!response.ok) {
    const error = new Error("http") as Error & { status: number; body: unknown };
    error.status = response.status;
    error.body = payload;
    throw error;
  }
  return { status: response.status, body: payload };
}
