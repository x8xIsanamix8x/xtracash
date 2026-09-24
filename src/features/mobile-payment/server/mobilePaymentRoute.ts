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

import {
  CoreMobilePaymentError,
  MobilePaymentAccessRestrictedError,
} from "./coreMobilePayment";

type AuthenticatedOperation<T> = (
  accessToken: string,
  signal: AbortSignal,
) => Promise<T | MobilePaymentOperationResponse<T>>;

const operationResponseMarker = Symbol("mobile-payment-operation-response");

type MobilePaymentOperationResponse<T> = Readonly<{
  [operationResponseMarker]: true;
  body: T;
  status: number;
}>;

export function mobilePaymentOperationResponse<T>(body: T, status: number) {
  return {
    [operationResponseMarker]: true,
    body,
    status,
  } as const;
}

function isMobilePaymentOperationResponse<T>(
  value: T | MobilePaymentOperationResponse<T>,
): value is MobilePaymentOperationResponse<T> {
  return typeof value === "object"
    && value !== null
    && operationResponseMarker in value;
}

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
    return authJson({ error: "invalid_upstream_response" }, 502);
  }

  switch (error.status) {
    case 400:
      return authJson({ error: "invalid_request", message: error.detail }, 400);
    case 403:
      return authJson({ error: "business_rule", message: error.detail }, 403);
    case 404:
      return authJson({ error: "not_found", message: error.detail }, 404);
    case 409:
      return authJson({ error: "conflict", message: error.detail }, 409);
    case 422:
      return authJson({ error: "business_rule", message: error.detail }, 422);
    case 429:
      return serviceUnavailableResponse();
    default:
      return authJson({ error: "upstream_error" }, 502);
  }
}

function operationFailureResponse(error: unknown) {
  if (error instanceof MobilePaymentAccessRestrictedError) {
    return authJson({
      error: "business_rule",
      accessStatus: error.accessStatus,
    }, 403);
  }

  return error instanceof CoreMobilePaymentError
    ? coreFailureResponse(error)
    : serviceUnavailableResponse();
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
    return isMobilePaymentOperationResponse(result)
      ? authJson(result.body, result.status)
      : authJson(result);
  };

  try {
    return withRotatedSession(await execute(accessToken), rotatedTokens);
  } catch (error) {
    if (
      !(error instanceof CoreMobilePaymentError)
      || error.type !== "http"
      || error.status !== 401
    ) {
      const response = operationFailureResponse(error);
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

      const response = operationFailureResponse(retryError);
      return withRotatedSession(response, rotatedTokens);
    }
  }
}
