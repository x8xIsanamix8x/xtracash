import { NextResponse, type NextRequest } from "next/server";

import { isProtectedRoute } from "@/features/auth/session/routes";
import {
  clearAuthSessionCookies,
  hasAuthCookieArtifacts,
  readAuthCookieSession,
} from "@/features/auth/session/server/sessionCookies";
import {
  sessionExpiredUrl,
  signInRequiredUrl,
} from "@/lib/accessNotificationNavigation";

export async function proxy(request: NextRequest) {
  if (!isProtectedRoute(request.nextUrl.pathname)) return NextResponse.next();

  const cookieSession = await readAuthCookieSession(request);
  if (
    cookieSession.ok
    && cookieSession.session.refreshToken
    && cookieSession.session.marker.refreshExpiresAt > Date.now()
  ) {
    return NextResponse.next();
  }

  const hadSession = hasAuthCookieArtifacts(request);
  const redirectUrl = new URL(hadSession ? sessionExpiredUrl : signInRequiredUrl, request.url);
  const response = NextResponse.redirect(redirectUrl);
  clearAuthSessionCookies(response);
  return response;
}

export const config = {
  matcher: [
    "/home/:path*",
    "/mobile-payment/:path*",
    "/profile/:path*",
  ],
};
