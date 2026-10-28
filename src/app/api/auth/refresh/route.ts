import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import {
  clearAuthSessionCookies,
  setAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";

export async function POST(request: NextRequest) {
  const result = await refreshAuthSession(request);

  if (result.ok) {
    const response = authJson({ authenticated: true });

    try {
      const marker = await setAuthSessionCookies(response, result.tokens);
      const successResponse = authJson({ authenticated: true, expiresAt: marker.accessExpiresAt });
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
