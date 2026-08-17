import "server-only";

import type { NextRequest } from "next/server";

import { CoreAuthError, refreshWithCore, type CoreAuthTokens } from "./coreAuth";
import { readAuthCookieSession } from "./sessionCookies";

export type RefreshSessionResult =
  | Readonly<{ ok: true; tokens: CoreAuthTokens }>
  | Readonly<{ ok: false; type: "configuration" | "invalid" | "upstream" }>;

export async function refreshAuthSession(
  request: NextRequest,
): Promise<RefreshSessionResult> {
  const cookieSession = await readAuthCookieSession(request);

  if (!cookieSession.ok) {
    return cookieSession;
  }

  const { marker, refreshToken } = cookieSession.session;
  if (!refreshToken || marker.refreshExpiresAt <= Date.now()) {
    return { ok: false, type: "invalid" };
  }

  try {
    const tokens = await refreshWithCore(refreshToken, request.signal);
    return { ok: true, tokens };
  } catch (error) {
    if (error instanceof CoreAuthError) {
      if (error.type === "configuration") return { ok: false, type: "configuration" };
      if (error.type === "http" && [400, 401, 403].includes(error.status ?? 0)) {
        return { ok: false, type: "invalid" };
      }
    }

    return { ok: false, type: "upstream" };
  }
}
