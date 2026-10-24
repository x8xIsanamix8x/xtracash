import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type { CoreAuthTokens } from "@/features/auth/session/server/coreAuth";
import { authJson } from "@/features/auth/session/server/routeResponses";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import { clearAuthSessionCookies, readAuthCookieSession, setAuthSessionCookies } from "@/features/auth/session/server/sessionCookies";
import { requestMarketplaceCore, requestMarketplaceImage, type MarketplaceCoreResult } from "./marketplaceCore";

function unauthenticated() { const response = authJson({ error: "unauthenticated" }, 401); clearAuthSessionCookies(response); return response; }
function unavailable() { return authJson({ error: "service_unavailable" }, 503); }
async function execute(accessToken: string, path: string, request: NextRequest, method: "GET" | "POST", body?: unknown) {
  return requestMarketplaceCore(accessToken, path, request.signal, method, body);
}
function failure(error: unknown) {
  if (error instanceof Error && "status" in error) {
    const e = error as Error & { status: number; body: unknown };
    const payload = e.body && typeof e.body === "object" ? e.body as Record<string, unknown> : {};
    const code = typeof payload.code === "string" ? payload.code : typeof payload.codigo === "string" ? payload.codigo : undefined;
    return authJson({ error: "upstream_error", diagnostic: { type: "http", status: e.status, ...(code ? { code } : {}) } }, e.status >= 400 && e.status < 500 ? e.status : 502);
  }
  return authJson({ error: "upstream_error" }, 502);
}
async function withCookies(response: NextResponse, tokens: CoreAuthTokens | null) {
  if (!tokens) return response;
  try { await setAuthSessionCookies(response, tokens); return response; }
  catch { const fallback = unavailable(); clearAuthSessionCookies(fallback); return fallback; }
}
function unauthorized(error: unknown) { return error instanceof Error && "status" in error && (error as Error & {status:number}).status === 401; }

function imageFailure(error: unknown) {
  if (error instanceof Error && "status" in error) {
    const e = error as Error & { status: number; body: unknown };
    return failure(e);
  }
  return authJson({ error: "upstream_error" }, 502);
}

function imageResponse(result: Awaited<ReturnType<typeof requestMarketplaceImage>>) {
  return new NextResponse(result.body, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function runMarketplaceImageOperation(request: NextRequest, productId: string, imageId: string) {
  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) return cookieSession.type === "configuration" ? unavailable() : unauthenticated();
  let accessToken = cookieSession.session.accessToken;
  let rotated: CoreAuthTokens | null = null;
  let refreshed = false;
  const refresh = async () => {
    refreshed = true;
    const result = await refreshAuthSession(request);
    if (!result.ok) return result.type === "invalid" ? unauthenticated() : unavailable();
    rotated = result.tokens;
    accessToken = result.tokens.accessToken;
    return null;
  };
  if (!accessToken || cookieSession.session.marker.accessExpiresAt <= Date.now()) {
    const response = await refresh(); if (response) return response;
  }
  const run = () => requestMarketplaceImage(accessToken!, productId, imageId, request.signal);
  try {
    return withCookies(imageResponse(await run()), rotated);
  } catch (error) {
    if (!unauthorized(error)) return withCookies(imageFailure(error), rotated);
    if (refreshed) return unauthenticated();
    const response = await refresh(); if (response) return response;
    try { return withCookies(imageResponse(await run()), rotated); }
    catch (retryError) { return unauthorized(retryError) ? unauthenticated() : withCookies(imageFailure(retryError), rotated); }
  }
}

export async function runMarketplaceOperation(request: NextRequest, path: string, method: "GET" | "POST" = "GET", body?: unknown) {
  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) return cookieSession.type === "configuration" ? unavailable() : unauthenticated();
  let accessToken = cookieSession.session.accessToken;
  let rotated: CoreAuthTokens | null = null;
  let refreshed = false;
  const refresh = async () => {
    refreshed = true;
    const result = await refreshAuthSession(request);
    if (!result.ok) return result.type === "invalid" ? unauthenticated() : unavailable();
    rotated = result.tokens;
    accessToken = result.tokens.accessToken;
    return null;
  };
  if (!accessToken || cookieSession.session.marker.accessExpiresAt <= Date.now()) {
    const response = await refresh(); if (response) return response;
  }
  const run = () => execute(accessToken!, path, request, method, body);
  try {
    const result: MarketplaceCoreResult = await run();
    return withCookies(authJson(result.body, result.status), rotated);
  } catch (error) {
    if (!unauthorized(error)) return withCookies(failure(error), rotated);
    if (refreshed) return unauthenticated();
    const response = await refresh(); if (response) return response;
    try {
      const result: MarketplaceCoreResult = await run();
      return withCookies(authJson(result.body, result.status), rotated);
    } catch (retryError) { return unauthorized(retryError) ? unauthenticated() : withCookies(failure(retryError), rotated); }
  }
}
