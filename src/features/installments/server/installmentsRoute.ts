import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import type { CoreAuthTokens } from "@/features/auth/session/server/coreAuth";
import { authJson } from "@/features/auth/session/server/routeResponses";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import {
  clearAuthSessionCookies,
  readAuthCookieSession,
  setAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";

import { CoreInstallmentsError } from "./coreInstallments";
import { getInstallmentsFailureResponse } from "./installmentsFailure";

type AuthenticatedOperation<T> = (
  accessToken: string,
  signal: AbortSignal,
) => Promise<T>;

function unauthenticatedResponse() {
  const response = authJson({ error: "unauthenticated" }, 401);
  clearAuthSessionCookies(response);
  return response;
}

function serviceUnavailableResponse() {
  return authJson({ error: "service_unavailable" }, 503);
}

function failureResponse(error: unknown) {
  if (!(error instanceof CoreInstallmentsError)) {
    return authJson({ error: "upstream_error" }, 502);
  }
  const failure = getInstallmentsFailureResponse(error);
  return authJson(failure.body, failure.status);
}

function isCoreUnauthorized(error: unknown) {
  return error instanceof CoreInstallmentsError
    && error.type === "http"
    && error.status === 401;
}

async function withRotatedSession(
  response: NextResponse,
  tokens: CoreAuthTokens | null,
) {
  if (tokens === null) return response;

  try {
    await setAuthSessionCookies(response, tokens);
    return response;
  } catch {
    const fallback = serviceUnavailableResponse();
    clearAuthSessionCookies(fallback);
    return fallback;
  }
}

/**
 * Ejecuta una operación contra Core con el token de la sesión. Si el token venció
 * lo renueva antes; si Core responde 401, renueva una vez y reintenta.
 */
export async function runAuthenticatedInstallmentsOperation<T>(
  request: NextRequest,
  operation: AuthenticatedOperation<T>,
  successStatus = 200,
): Promise<NextResponse> {
  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) {
    return cookieSession.type === "configuration"
      ? serviceUnavailableResponse()
      : unauthenticatedResponse();
  }

  let accessToken = cookieSession.session.accessToken;
  let refreshUsed = false;
  let rotatedTokens: CoreAuthTokens | null = null;

  const refresh = async () => {
    refreshUsed = true;
    const refreshResult = await refreshAuthSession(request);
    if (!refreshResult.ok) {
      return refreshResult.type === "invalid"
        ? unauthenticatedResponse()
        : serviceUnavailableResponse();
    }
    rotatedTokens = refreshResult.tokens;
    accessToken = refreshResult.tokens.accessToken;
    return null;
  };

  if (!accessToken || cookieSession.session.marker.accessExpiresAt <= Date.now()) {
    const refreshFailure = await refresh();
    if (refreshFailure) return refreshFailure;
  }

  const execute = async () => authJson(
    await operation(accessToken!, request.signal),
    successStatus,
  );

  try {
    return withRotatedSession(await execute(), rotatedTokens);
  } catch (error) {
    if (!isCoreUnauthorized(error)) {
      return withRotatedSession(failureResponse(error), rotatedTokens);
    }
    if (refreshUsed) return unauthenticatedResponse();

    const refreshFailure = await refresh();
    if (refreshFailure) return refreshFailure;

    try {
      return withRotatedSession(await execute(), rotatedTokens);
    } catch (retryError) {
      if (isCoreUnauthorized(retryError)) return unauthenticatedResponse();
      return withRotatedSession(failureResponse(retryError), rotatedTokens);
    }
  }
}
