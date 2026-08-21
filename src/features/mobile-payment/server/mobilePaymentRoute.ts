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

import { CoreMobilePaymentError } from "./coreMobilePayment";

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

function coreFailureResponse(error: CoreMobilePaymentError) {
  if (error.type === "configuration" || error.type === "network") {
    return serviceUnavailableResponse();
  }
  if (error.type === "protocol") {
    return authJson({ error: "upstream_error" }, 502);
  }

  switch (error.status) {
    case 400:
      return authJson({ error: "invalid_request" }, 400);
    case 403:
      return authJson({ error: "business_rule" }, 403);
    case 404:
      return authJson({ error: "not_found" }, 404);
    case 409:
      return authJson({ error: "conflict" }, 409);
    case 422:
      return authJson({ error: "business_rule" }, 422);
    case 429:
      return serviceUnavailableResponse();
    default:
      return authJson({ error: "upstream_error" }, 502);
  }
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
    const failureResponse = serviceUnavailableResponse();
    clearAuthSessionCookies(failureResponse);
    return failureResponse;
  }
}

export async function runAuthenticatedMobilePaymentOperation<T>(
  request: NextRequest,
  operation: AuthenticatedOperation<T>,
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

  const execute = async (token: string) => {
    const result = await operation(token, request.signal);
    return authJson(result);
  };

  try {
    return withRotatedSession(await execute(accessToken), rotatedTokens);
  } catch (error) {
    if (
      !(error instanceof CoreMobilePaymentError)
      || error.type !== "http"
      || error.status !== 401
    ) {
      const response = error instanceof CoreMobilePaymentError
        ? coreFailureResponse(error)
        : serviceUnavailableResponse();
      return withRotatedSession(response, rotatedTokens);
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
      return withRotatedSession(
        await execute(refreshResult.tokens.accessToken),
        rotatedTokens,
      );
    } catch (retryError) {
      if (
        retryError instanceof CoreMobilePaymentError
        && retryError.type === "http"
        && retryError.status === 401
      ) {
        return unauthenticatedResponse();
      }

      const response = retryError instanceof CoreMobilePaymentError
        ? coreFailureResponse(retryError)
        : serviceUnavailableResponse();
      return withRotatedSession(response, rotatedTokens);
    }
  }
}
