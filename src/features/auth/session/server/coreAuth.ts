import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

export type CoreAuthErrorType = "configuration" | "http" | "network" | "protocol";

export class CoreAuthError extends Error {
  readonly type: CoreAuthErrorType;
  readonly status: number | null;

  constructor(type: CoreAuthErrorType, status: number | null = null) {
    super(type);
    this.name = "CoreAuthError";
    this.type = type;
    this.status = status;
  }
}

export type CoreAuthTokens = Readonly<{
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}>;

export type CoreLoginRequest = Readonly<{
  identifier: string;
  password: string;
}>;

function getCoreEndpoint(pathname: string): string {
  const configuration = getServerCoreApiBaseUrl();

  if (!configuration.ok) {
    throw new CoreAuthError("configuration");
  }

  return `${configuration.baseUrl}${pathname}`;
}

function isPositiveDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

async function readTokenResponse(response: Response): Promise<CoreAuthTokens> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new CoreAuthError("protocol");
  }

  if (!body || typeof body !== "object") {
    throw new CoreAuthError("protocol");
  }

  const candidate = body as Record<string, unknown>;

  if (
    candidate.tokenType !== "Bearer"
    || typeof candidate.accessToken !== "string"
    || !candidate.accessToken
    || !isPositiveDuration(candidate.expiresIn)
    || typeof candidate.refreshToken !== "string"
    || !candidate.refreshToken
    || !isPositiveDuration(candidate.refreshExpiresIn)
  ) {
    throw new CoreAuthError("protocol");
  }

  return {
    tokenType: "Bearer",
    accessToken: candidate.accessToken,
    expiresIn: candidate.expiresIn,
    refreshToken: candidate.refreshToken,
    refreshExpiresIn: candidate.refreshExpiresIn,
  };
}

async function requestTokens(
  pathname: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<CoreAuthTokens> {
  let response: Response;

  try {
    response = await fetch(getCoreEndpoint(pathname), {
      ...init,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof CoreAuthError) throw error;
    throw new CoreAuthError("network");
  }

  if (!response.ok) {
    throw new CoreAuthError("http", response.status);
  }

  return readTokenResponse(response);
}

export function loginWithCore(
  request: CoreLoginRequest,
  signal: AbortSignal,
): Promise<CoreAuthTokens> {
  return requestTokens(
    "/api/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    signal,
  );
}

export function refreshWithCore(
  refreshToken: string,
  signal: AbortSignal,
): Promise<CoreAuthTokens> {
  return requestTokens(
    "/api/refresh",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    },
    signal,
  );
}

export async function logoutFromCore(
  refreshToken: string,
  signal: AbortSignal,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(getCoreEndpoint("/api/logout"), {
      method: "POST",
      cache: "no-store",
      headers: { Authorization: `Bearer ${refreshToken}` },
      signal,
    });
  } catch (error) {
    if (error instanceof CoreAuthError) throw error;
    throw new CoreAuthError("network");
  }

  if (response.status !== 204) {
    throw new CoreAuthError("http", response.status);
  }
}
