import { NextResponse, type NextRequest } from "next/server";

import { logoutFromCore } from "@/features/auth/session/server/coreAuth";
import { noStoreHeaders } from "@/features/auth/session/server/routeResponses";
import {
  AUTH_REFRESH_COOKIE,
  clearAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await logoutFromCore(refreshToken, request.signal);
    } catch {
      // La limpieza local es obligatoria aunque Core API no pueda revocar la sesión.
    }
  }

  const response = new NextResponse(null, { status: 204, headers: noStoreHeaders });
  clearAuthSessionCookies(response);
  return response;
}
