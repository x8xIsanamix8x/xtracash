import type { NextRequest } from "next/server";

import type { CoreAuthTokens } from "@/features/auth/session/server/coreAuth";
import { authJson } from "@/features/auth/session/server/routeResponses";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import {
  clearAuthSessionCookies,
  readAuthCookieSession,
  setAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";

import { CoreNotificationsError } from "./coreNotifications";

type CoreOperation = (accessToken: string, signal: AbortSignal) => Promise<unknown>;

function unauthenticatedResponse() {
  const response = authJson({ error: "unauthenticated" }, 401);
  clearAuthSessionCookies(response);
  return response;
}

function failureResponse(error: CoreNotificationsError) {
  if (error.type === "configuration" || error.type === "network") {
    return authJson({ error: "service_unavailable" }, 503);
  }
  if (error.type === "http" && error.status === 404) {
    return authJson({ error: "not_found" }, 404);
  }
  const diagnostic = process.env.NODE_ENV === "production"
    ? undefined
    : { type: error.type, status: error.status, detail: error.detail };
  return authJson({ error: "upstream_error", ...(diagnostic ? { diagnostic } : {}) }, 502);
}

async function withRotatedSession(
  response: ReturnType<typeof authJson>,
  tokens: CoreAuthTokens | null,
) {
  if (!tokens) return response;
  try {
    await setAuthSessionCookies(response, tokens);
    return response;
  } catch {
    const failure = authJson({ error: "service_unavailable" }, 503);
    clearAuthSessionCookies(failure);
    return failure;
  }
}

export async function runNotificationsRequest(request: NextRequest, operation: CoreOperation) {
  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) {
    return cookieSession.type === "configuration"
      ? authJson({ error: "service_unavailable" }, 503)
      : unauthenticatedResponse();
  }

  let accessToken = cookieSession.session.accessToken;
  let refreshed = false;
  let rotatedTokens: CoreAuthTokens | null = null;

  if (!accessToken || cookieSession.session.marker.accessExpiresAt <= Date.now()) {
    const refresh = await refreshAuthSession(request);
    if (!refresh.ok) {
      return refresh.type === "invalid"
        ? unauthenticatedResponse()
        : authJson({ error: "service_unavailable" }, 503);
    }
    refreshed = true;
    rotatedTokens = refresh.tokens;
    accessToken = refresh.tokens.accessToken;
  }

  try {
    const result = await operation(accessToken, request.signal);
    return withRotatedSession(authJson(result), rotatedTokens);
  } catch (error) {
    if (!(error instanceof CoreNotificationsError)) {
      return withRotatedSession(authJson({ error: "service_unavailable" }, 503), rotatedTokens);
    }
    if (error.type !== "http" || error.status !== 401) {
      return withRotatedSession(failureResponse(error), rotatedTokens);
    }
    if (refreshed) return unauthenticatedResponse();

    const refresh = await refreshAuthSession(request);
    if (!refresh.ok) {
      return refresh.type === "invalid"
        ? unauthenticatedResponse()
        : authJson({ error: "service_unavailable" }, 503);
    }
    rotatedTokens = refresh.tokens;
    try {
      const result = await operation(refresh.tokens.accessToken, request.signal);
      return withRotatedSession(authJson(result), rotatedTokens);
    } catch (retryError) {
      if (retryError instanceof CoreNotificationsError && retryError.type === "http" && retryError.status === 401) {
        return unauthenticatedResponse();
      }
      const response = retryError instanceof CoreNotificationsError
        ? failureResponse(retryError)
        : authJson({ error: "service_unavailable" }, 503);
      return withRotatedSession(response, rotatedTokens);
    }
  }
}
