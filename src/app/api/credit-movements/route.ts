import type { NextRequest } from "next/server";

import type { CoreAuthTokens } from "@/features/auth/session/server/coreAuth";
import { authJson } from "@/features/auth/session/server/routeResponses";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import {
  clearAuthSessionCookies,
  readAuthCookieSession,
  setAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";
import {
  CoreCreditMovementsError,
  getCreditMovementsFromCore,
} from "@/features/credit-movements/server/coreCreditMovements";
import { parseCreditMovementQuery } from "@/features/credit-movements/server/queryValidation";

function unauthenticatedResponse() {
  const response = authJson({ error: "unauthenticated" }, 401);
  clearAuthSessionCookies(response);
  return response;
}

function serviceUnavailableResponse() {
  return authJson({ error: "service_unavailable" }, 503);
}

function coreFailureResponse(error: CoreCreditMovementsError) {
  if (error.type === "configuration" || error.type === "network") {
    return serviceUnavailableResponse();
  }
  return authJson({ error: "upstream_error" }, 502);
}

async function withRotatedSession(
  response: ReturnType<typeof authJson>,
  tokens: CoreAuthTokens | null,
) {
  if (tokens === null) return response;

  try {
    await setAuthSessionCookies(response, tokens);
    return response;
  } catch {
    const failureResponse = serviceUnavailableResponse();
    clearAuthSessionCookies(failureResponse);
    return failureResponse;
  }
}

export async function GET(request: NextRequest) {
  const query = parseCreditMovementQuery(request.nextUrl.searchParams);
  if (query === null) {
    return authJson({ error: "invalid_request" }, 400);
  }

  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) {
    return cookieSession.type === "configuration"
      ? serviceUnavailableResponse()
      : unauthenticatedResponse();
  }

  let accessToken = cookieSession.session.accessToken;
  let refreshUsed = false;
  let rotatedTokens: CoreAuthTokens | null = null;

  if (!accessToken || cookieSession.session.marker.accessExpiresAt <= Date.now()) {
    refreshUsed = true;
    const refreshResult = await refreshAuthSession(request);
    if (!refreshResult.ok) {
      return refreshResult.type === "invalid"
        ? unauthenticatedResponse()
        : serviceUnavailableResponse();
    }
    rotatedTokens = refreshResult.tokens;
    accessToken = refreshResult.tokens.accessToken;
  }

  try {
    const page = await getCreditMovementsFromCore(
      accessToken,
      query,
      request.signal,
    );
    return withRotatedSession(authJson(page), rotatedTokens);
  } catch (error) {
    if (!(error instanceof CoreCreditMovementsError)) {
      return withRotatedSession(serviceUnavailableResponse(), rotatedTokens);
    }

    if (error.type !== "http" || error.status !== 401) {
      return withRotatedSession(coreFailureResponse(error), rotatedTokens);
    }

    if (refreshUsed) return unauthenticatedResponse();

    const refreshResult = await refreshAuthSession(request);
    if (!refreshResult.ok) {
      return refreshResult.type === "invalid"
        ? unauthenticatedResponse()
        : serviceUnavailableResponse();
    }
    rotatedTokens = refreshResult.tokens;

    try {
      const page = await getCreditMovementsFromCore(
        refreshResult.tokens.accessToken,
        query,
        request.signal,
      );
      return withRotatedSession(authJson(page), rotatedTokens);
    } catch (retryError) {
      if (
        retryError instanceof CoreCreditMovementsError
        && retryError.type === "http"
        && retryError.status === 401
      ) {
        return unauthenticatedResponse();
      }

      const response = retryError instanceof CoreCreditMovementsError
        ? coreFailureResponse(retryError)
        : serviceUnavailableResponse();
      return withRotatedSession(response, rotatedTokens);
    }
  }
}
