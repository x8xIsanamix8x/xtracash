import type { NextRequest } from "next/server";
import { runMarketplaceImageOperation, runMarketplaceOperation } from "@/features/marketplace/server/marketplaceRoute";
import { isC2pChargeRequest, isC2pOtpRequest, isCreatePurchaseRequest, isInitialPaymentRequest } from "@/features/marketplace/contractValidation";

const ID = /^[\w.-]{1,120}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function corePath(segments: string[]): string | null {
  if (segments.length === 1 && ["catalogo", "compras"].includes(segments[0])) return segments[0];
  if (segments.length === 2 && segments[0] === "catalogo" && segments[1] === "categorias") return "catalogo/categorias";
  if (segments.length === 2 && segments[0] === "marketplace" && ["cupo", "horario"].includes(segments[1])) return segments.join("/");
  if (segments[0] === "catalogo" && ID.test(segments[1] ?? "") && (segments.length === 2 || (segments.length === 3 && segments[2] === "planes"))) return segments.join("/");
  if (segments[0] === "compras" && UUID.test(segments[1] ?? "") && (segments.length === 2 || (segments.length === 3 && segments[2] === "pago-inicial") || (segments.length === 4 && segments[2] === "pago-inicial" && segments[3] === "c2p") || (segments.length === 5 && segments[2] === "pago-inicial" && segments[3] === "c2p" && segments[4] === "otp"))) return segments.join("/");
  if (segments[0] === "compras" && UUID.test(segments[1] ?? "") && segments.length === 4 && segments[2] === "contrato" && segments[3] === "base64") return segments.join("/");
  return null;
}

function validBody(path: string, body: unknown): boolean {
  if (path === "compras") return isCreatePurchaseRequest(body);
  if (/\/pago-inicial$/.test(path)) return isInitialPaymentRequest(body);
  if (/\/pago-inicial\/c2p\/otp$/.test(path)) return isC2pOtpRequest(body);
  if (/\/pago-inicial\/c2p$/.test(path)) return isC2pChargeRequest(body);
  return false;
}

async function resolve(request: NextRequest, context: { params: Promise<{ segments: string[] }> }, method: "GET" | "POST") {
  const { segments } = await context.params;
  if (method === "GET" && segments.length === 4 && segments[0] === "catalogo" && UUID.test(segments[1]) && segments[2] === "imagenes" && UUID.test(segments[3])) {
    return runMarketplaceImageOperation(request, segments[1], segments[3]);
  }
  const path = corePath(segments);
  if (!path) return Response.json({ error: "not_found" }, { status: 404 });
  if (method === "POST" && !["compras", ...["pago-inicial", "pago-inicial/c2p", "pago-inicial/c2p/otp"].map((suffix) => `compras/${segments[1]}/${suffix}`)].includes(path)) return Response.json({ error: "not_found" }, { status: 404 });
  const query = request.nextUrl.search;
  let body: unknown;
  if (method === "POST") {
    try { body = await request.json(); } catch { return Response.json({ error: "invalid_request" }, { status: 400 }); }
    if (!validBody(path, body)) return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  return runMarketplaceOperation(request, `${path}${query}`, method, body);
}

export function GET(request: NextRequest, context: { params: Promise<{ segments: string[] }> }) { return resolve(request, context, "GET"); }
export function POST(request: NextRequest, context: { params: Promise<{ segments: string[] }> }) { return resolve(request, context, "POST"); }
