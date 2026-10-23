export class MarketplaceServiceError extends Error {
  constructor(readonly status: number, readonly body: unknown) { super("marketplace_request_failed"); }
}

export type C2pOtpResponse = Readonly<{ solicitada: boolean; otp: string }>;
export type MarketplacePurchaseResponse = Readonly<{
  id: string;
  estado: string;
  etapa: string;
  consumoId: string | null;
  pagarA?: Record<string, unknown> | null;
  pago?: Record<string, unknown> | null;
  [key: string]: unknown;
}>;

async function request<T>(path: string, signal?: AbortSignal, init?: RequestInit): Promise<{ data: T; status: number }> {
  let response: Response;
  try {
    response = await fetch(`/api/marketplace/${path}`, { ...init, signal, cache: "no-store", credentials: "same-origin", headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new MarketplaceServiceError(0, { error: "network" });
  }
  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) throw new MarketplaceServiceError(response.status, body);
  return { data: body as T, status: response.status };
}

export type CatalogProduct = Readonly<{
  id: string;
  nombre: string;
  descripcionCorta?: string;
  descripcion?: string;
  sku?: string;
  categoria?: string | { nombre?: string };
  subcategoria?: string | { nombre?: string };
  marca?: string;
  modelo?: string;
  condicion?: string;
  moneda?: string;
  disponibilidad?: string;
  disponible?: boolean;
  stock?: number;
  precio?: { usdt?: number | string; bs?: number | string; moneda?: string };
  atributos?: Record<string, string | number | boolean | null | undefined>;
  garantia?: string;
  entrega?: { modalidad?: string; tiempo?: string; zona?: string; costoUsdt?: string };
  imagenPrincipal?: string;
  imagenes?: ReadonlyArray<{ id: string; url?: string; principal?: boolean }>;
  comercio?: { nombre?: string };
}>;
export type CatalogPage = Readonly<{ items: CatalogProduct[]; page: number; size: number; totalPages: number; totalElements: number }>;
export type MarketplaceLimit = Readonly<{ limite?: { usdt?: number | string; bs?: number | string }; disponible?: { usdt?: number | string; bs?: number | string }; estado: string }>;
export type CatalogCategory = Readonly<{ id: string; padreId?: string; nombre: string }>;

export function getCatalog(query: string, page: number, signal?: AbortSignal, categoryId?: string) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (query.trim()) params.set("q", query.trim());
  if (categoryId) params.set("categoriaId", categoryId);
  return request<CatalogPage>(`catalogo?${params}`, signal);
}
export function getCatalogCategories(signal?: AbortSignal) { return request<CatalogCategory[]>("catalogo/categorias", signal); }
export function getMarketplaceLimit(signal?: AbortSignal) { return request<MarketplaceLimit>("marketplace/cupo", signal); }
export function getProduct(id: string, signal?: AbortSignal) { return request<CatalogProduct>(`catalogo/${encodeURIComponent(id)}`, signal); }
export function getProductPlan(id: string, signal?: AbortSignal) { return request<Record<string, unknown>>(`catalogo/${encodeURIComponent(id)}/planes`, signal); }
export function getMarketplaceHours(signal?: AbortSignal) { return request<Record<string, unknown>>("marketplace/horario", signal); }
export function getPurchases(signal?: AbortSignal) { return request<unknown[]>("compras", signal); }
export function getPurchase(id: string, signal?: AbortSignal) { return request<MarketplacePurchaseResponse>(`compras/${encodeURIComponent(id)}`, signal); }
/** Datos bancarios de la empresa autenticada, sin cotización de cuotas. */
export function getMarketplacePaymentData(signal?: AbortSignal) { return request<Record<string, unknown>>("datos-pago", signal); }
export function createPurchase(productId: string, downPaymentUsdt: number, signal?: AbortSignal) { return request<Record<string, unknown>>("compras", signal, { method: "POST", body: JSON.stringify({ productoId: productId, pagoInicialUsdt: downPaymentUsdt }) }); }
export function reportInitialPayment(id: string, payload: Record<string, unknown>, signal?: AbortSignal) { return request<Record<string, unknown>>(`compras/${encodeURIComponent(id)}/pago-inicial`, signal, { method: "POST", body: JSON.stringify(payload) }); }
export function requestC2pOtp(id: string, payload: Record<string, unknown>, signal?: AbortSignal) { return request<C2pOtpResponse>(`compras/${encodeURIComponent(id)}/pago-inicial/c2p/otp`, signal, { method: "POST", body: JSON.stringify(payload) }); }
export function payC2p(id: string, payload: Record<string, unknown>, signal?: AbortSignal) { return request<MarketplacePurchaseResponse>(`compras/${encodeURIComponent(id)}/pago-inicial/c2p`, signal, { method: "POST", body: JSON.stringify(payload) }); }
export function getPurchaseContract(id: string, signal?: AbortSignal) { return request<{ nombreArchivo: string; contentType: string; base64: string }>(`compras/${encodeURIComponent(id)}/contrato/base64`, signal); }
export function signPurchase(id: string, signal?: AbortSignal) { return request<MarketplacePurchaseResponse>(`compras/${encodeURIComponent(id)}/firma`, signal, { method: "POST", body: JSON.stringify({ firmado: true }) }); }
