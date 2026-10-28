import type { NextRequest } from "next/server";

import { CoreAuthError, loginWithCore } from "@/features/auth/session/server/coreAuth";
import { authJson } from "@/features/auth/session/server/routeResponses";
import { setAuthSessionCookies } from "@/features/auth/session/server/sessionCookies";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginBodyResult =
  | Readonly<{ ok: true; request: Readonly<{ identifier: string; password: string }> }>
  | Readonly<{ ok: false }>;

async function readLoginBody(request: NextRequest): Promise<LoginBodyResult> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { ok: false };
  }

  if (!body || typeof body !== "object") return { ok: false };

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.identifier !== "string" || typeof candidate.password !== "string") {
    return { ok: false };
  }

  const identifier = candidate.identifier.trim().toLowerCase();
  if (!emailPattern.test(identifier) || !candidate.password) return { ok: false };

  return {
    ok: true,
    request: { identifier, password: candidate.password },
  };
}

export async function POST(request: NextRequest) {
  const loginBody = await readLoginBody(request);
  if (!loginBody.ok) {
    return authJson({ authenticated: false, error: "invalid_request" }, 400);
  }

  try {
    const tokens = await loginWithCore(loginBody.request, request.signal);
    const response = authJson({ authenticated: true });
    const marker = await setAuthSessionCookies(response, tokens);

    return authJsonWithCookies(response, marker.accessExpiresAt);
  } catch (error) {
    if (error instanceof CoreAuthError && error.type === "http" && error.status === 401) {
      return authJson({ authenticated: false, error: "invalid_credentials" }, 401);
    }

    return authJson({ authenticated: false, error: "service_unavailable" }, 503);
  }
}

function authJsonWithCookies(response: ReturnType<typeof authJson>, expiresAt: number) {
  const nextResponse = authJson({ authenticated: true, expiresAt });

  for (const cookie of response.cookies.getAll()) {
    nextResponse.cookies.set(cookie);
  }

  return nextResponse;
}
