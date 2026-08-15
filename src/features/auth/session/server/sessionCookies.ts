import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import type { CoreAuthTokens } from "./coreAuth";

export const AUTH_ACCESS_COOKIE = "impulsate-access";
export const AUTH_REFRESH_COOKIE = "impulsate-refresh";
export const AUTH_SESSION_COOKIE = "impulsate-session";

export type SessionMarker = Readonly<{
  version: 1;
  accessExpiresAt: number;
  refreshExpiresAt: number;
}>;

export type AuthCookieSession = Readonly<{
  accessToken: string | null;
  refreshToken: string | null;
  marker: SessionMarker;
}>;

export type AuthCookieSessionResult =
  | Readonly<{ ok: true; session: AuthCookieSession }>
  | Readonly<{ ok: false; type: "configuration" | "invalid" }>;

const encoder = new TextEncoder();
const MAX_COOKIE_VALUE_BYTES = 3_800;
const SESSION_MARKER_GRACE_SECONDS = 300;

function getSessionSecret(): string | null {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function toBase64Url(value: string | ArrayBuffer): string {
  return Buffer.from(typeof value === "string" ? value : new Uint8Array(value)).toString("base64url");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signMarker(marker: SessionMarker, secret: string): Promise<string> {
  const encodedPayload = toBase64Url(JSON.stringify(marker));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(secret),
    encoder.encode(encodedPayload),
  );

  return `${encodedPayload}.${toBase64Url(signature)}`;
}

async function verifyMarker(value: string, secret: string): Promise<SessionMarker | null> {
  const [encodedPayload, encodedSignature, ...extraParts] = value.split(".");
  if (!encodedPayload || !encodedSignature || extraParts.length > 0) return null;

  try {
    const isValid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(secret),
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );

    if (!isValid) return null;

    const marker = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionMarker>;
    if (
      marker.version !== 1
      || typeof marker.accessExpiresAt !== "number"
      || !Number.isFinite(marker.accessExpiresAt)
      || typeof marker.refreshExpiresAt !== "number"
      || !Number.isFinite(marker.refreshExpiresAt)
      || marker.refreshExpiresAt <= marker.accessExpiresAt
    ) {
      return null;
    }

    return marker as SessionMarker;
  } catch {
    return null;
  }
}

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthSessionCookies(
  response: NextResponse,
  tokens: CoreAuthTokens,
  now = Date.now(),
): Promise<SessionMarker> {
  const secret = getSessionSecret();
  if (!secret) throw new Error("auth-session-configuration");
  if (
    Buffer.byteLength(tokens.accessToken, "utf8") > MAX_COOKIE_VALUE_BYTES
    || Buffer.byteLength(tokens.refreshToken, "utf8") > MAX_COOKIE_VALUE_BYTES
  ) {
    throw new Error("auth-token-cookie-too-large");
  }

  const marker: SessionMarker = {
    version: 1,
    accessExpiresAt: now + tokens.expiresIn * 1000,
    refreshExpiresAt: now + tokens.refreshExpiresIn * 1000,
  };

  response.cookies.set(AUTH_ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: Math.floor(tokens.expiresIn),
    expires: new Date(marker.accessExpiresAt),
  });
  response.cookies.set(AUTH_REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: Math.floor(tokens.refreshExpiresIn),
    expires: new Date(marker.refreshExpiresAt),
  });
  response.cookies.set(AUTH_SESSION_COOKIE, await signMarker(marker, secret), {
    ...baseCookieOptions,
    maxAge: Math.floor(tokens.refreshExpiresIn) + SESSION_MARKER_GRACE_SECONDS,
    expires: new Date(marker.refreshExpiresAt + SESSION_MARKER_GRACE_SECONDS * 1000),
  });

  return marker;
}

export function clearAuthSessionCookies(response: NextResponse): void {
  for (const name of [AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE, AUTH_SESSION_COOKIE]) {
    response.cookies.set(name, "", {
      ...baseCookieOptions,
      expires: new Date(0),
      maxAge: 0,
    });
  }
}

export async function readAuthCookieSession(
  request: NextRequest,
): Promise<AuthCookieSessionResult> {
  const secret = getSessionSecret();
  if (!secret) return { ok: false, type: "configuration" };

  const markerValue = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!markerValue) return { ok: false, type: "invalid" };

  const marker = await verifyMarker(markerValue, secret);
  if (!marker) return { ok: false, type: "invalid" };

  return {
    ok: true,
    session: {
      marker,
      accessToken: request.cookies.get(AUTH_ACCESS_COOKIE)?.value ?? null,
      refreshToken: request.cookies.get(AUTH_REFRESH_COOKIE)?.value ?? null,
    },
  };
}

export function hasAuthCookieArtifacts(request: NextRequest): boolean {
  return [AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE, AUTH_SESSION_COOKIE]
    .some((name) => Boolean(request.cookies.get(name)?.value));
}
