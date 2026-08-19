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
  CoreAccountSummaryError,
  getAccountSummaryFromCore,
} from "@/features/home/server/coreAccountSummary";

function unauthenticatedResponse() {
  const response = authJson({ error: "unauthenticated" }, 401);
  clearAuthSessionCookies(response);
  return response;
}

function serviceUnavailableResponse() {
  return authJson({ error: "service_unavailable" }, 503);
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

function coreFailureResponse(error: CoreAccountSummaryError) {
  if (error.type === "configuration" || error.type === "network") {
    return serviceUnavailableResponse();
  }

  return authJson({ error: "upstream_error" }, 502);
}

export async function GET(request: NextRequest) {
  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) {
    if (cookieSession.type === "configuration") {
      return serviceUnavailableResponse();
    }
    return unauthenticatedResponse();
  }

  let accessToken = cookieSession.session.accessToken;
  let refreshUsed = false;
  let rotatedTokens: CoreAuthTokens | null = null;

  if (
    !accessToken
    || cookieSession.session.marker.accessExpiresAt <= Date.now()
  ) {
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
    const summary = await getAccountSummaryFromCore(accessToken, request.signal);
    return withRotatedSession(authJson(summary), rotatedTokens);
  } catch (error) {
    if (!(error instanceof CoreAccountSummaryError)) {
      return withRotatedSession(serviceUnavailableResponse(), rotatedTokens);
    }

    if (error.type !== "http" || error.status !== 401) {
      return withRotatedSession(coreFailureResponse(error), rotatedTokens);
    }

    if (refreshUsed) return unauthenticatedResponse();

    refreshUsed = true;
    const refreshResult = await refreshAuthSession(request);
    if (!refreshResult.ok) {
      return refreshResult.type === "invalid"
        ? unauthenticatedResponse()
        : serviceUnavailableResponse();
    }

    rotatedTokens = refreshResult.tokens;

    try {
      const summary = await getAccountSummaryFromCore(
        refreshResult.tokens.accessToken,
        request.signal,
      );
      return withRotatedSession(authJson(summary), rotatedTokens);
    } catch (retryError) {
      if (
        retryError instanceof CoreAccountSummaryError
        && retryError.type === "http"
        && retryError.status === 401
      ) {
        return unauthenticatedResponse();
      }

      const response = retryError instanceof CoreAccountSummaryError
        ? coreFailureResponse(retryError)
        : serviceUnavailableResponse();
      return withRotatedSession(response, rotatedTokens);
    }
  }
}
