import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import {
  clearAuthSessionCookies,
  readAuthCookieSession,
  setAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";

const RENEWAL_WINDOW_MS = 30_000;

export async function GET(request: NextRequest) {
  const cookieSession = await readAuthCookieSession(request);

  if (!cookieSession.ok) {
    const status = cookieSession.type === "configuration" ? 503 : 401;
    const response = authJson(
      cookieSession.type === "configuration"
        ? { authenticated: false, error: "service_unavailable" }
        : { authenticated: false },
      status,
    );
    if (cookieSession.type === "invalid") clearAuthSessionCookies(response);
    return response;
  }

  const { accessToken, marker, refreshToken } = cookieSession.session;
  if (!refreshToken || marker.refreshExpiresAt <= Date.now()) {
    const response = authJson({ authenticated: false }, 401);
    clearAuthSessionCookies(response);
    return response;
  }

  if (accessToken && marker.accessExpiresAt > Date.now() + RENEWAL_WINDOW_MS) {
    return authJson({ authenticated: true, expiresAt: marker.accessExpiresAt });
  }

  const result = await refreshAuthSession(request);
  if (result.ok) {
    const response = authJson({ authenticated: true });

    try {
      const nextMarker = await setAuthSessionCookies(response, result.tokens);
      const successResponse = authJson({ authenticated: true, expiresAt: nextMarker.accessExpiresAt });
      for (const cookie of response.cookies.getAll()) successResponse.cookies.set(cookie);
      return successResponse;
    } catch {
      const failureResponse = authJson(
        { authenticated: false, error: "service_unavailable" },
        503,
      );
      clearAuthSessionCookies(failureResponse);
      return failureResponse;
    }
  }

  if (result.type === "invalid") {
    const response = authJson({ authenticated: false }, 401);
    clearAuthSessionCookies(response);
    return response;
  }

  return authJson({ authenticated: false, error: "service_unavailable" }, 503);
}
