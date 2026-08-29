import type { NextRequest } from "next/server";

import type { CoreAuthTokens } from "@/features/auth/session/server/coreAuth";
import {
  CoreRecoveryError,
  requestPasswordRecoveryFromCore,
} from "@/features/auth/recovery/server/coreRecovery";
import { parseRecoveryApiRequest } from "@/features/auth/recovery/validation";
import { refreshAuthSession } from "@/features/auth/session/server/sessionManager";
import { authJson } from "@/features/auth/session/server/routeResponses";
import {
  clearAuthSessionCookies,
  readAuthCookieSession,
  setAuthSessionCookies,
} from "@/features/auth/session/server/sessionCookies";
import {
  CoreProfileError,
  getProfilePersonalInfoFromCore,
} from "@/features/profile/server/coreProfile";

async function readRequest(request: NextRequest) {
  try {
    return parseRecoveryApiRequest(await request.json());
  } catch {
    return null;
  }
}

function unauthenticatedResponse() {
  const response = authJson({ error: "unauthenticated" }, 401);
  clearAuthSessionCookies(response);
  return response;
}

function serviceUnavailableResponse() {
  return authJson({ error: "service_unavailable" }, 503);
}

async function withRotatedSession(
  response: ReturnType<typeof authJson>,
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

type ProfileEmailResult =
  | Readonly<{ email: string; response?: never; rotatedTokens: CoreAuthTokens | null }>
  | Readonly<{
    email?: never;
    response: ReturnType<typeof authJson>;
    rotatedTokens: CoreAuthTokens | null;
  }>;

async function resolveAuthenticatedProfileEmail(
  request: NextRequest,
): Promise<ProfileEmailResult> {
  const cookieSession = await readAuthCookieSession(request);
  if (!cookieSession.ok) {
    return {
      response: cookieSession.type === "configuration"
        ? serviceUnavailableResponse()
        : unauthenticatedResponse(),
      rotatedTokens: null,
    };
  }

  let accessToken = cookieSession.session.accessToken;
  let refreshUsed = false;
  let rotatedTokens: CoreAuthTokens | null = null;

  if (!accessToken || cookieSession.session.marker.accessExpiresAt <= Date.now()) {
    refreshUsed = true;
    const refreshResult = await refreshAuthSession(request);
    if (!refreshResult.ok) {
      return {
        response: refreshResult.type === "invalid"
          ? unauthenticatedResponse()
          : serviceUnavailableResponse(),
        rotatedTokens: null,
      };
    }
    rotatedTokens = refreshResult.tokens;
    accessToken = refreshResult.tokens.accessToken;
  }

  try {
    const personalInfo = await getProfilePersonalInfoFromCore(accessToken, request.signal);
    return { email: personalInfo.email, rotatedTokens };
  } catch (error) {
    if (!(error instanceof CoreProfileError)) {
      return { response: serviceUnavailableResponse(), rotatedTokens };
    }

    if (error.type !== "http" || error.status !== 401) {
      return {
        response: error.type === "configuration" || error.type === "network"
          ? serviceUnavailableResponse()
          : authJson({ error: "upstream_error" }, 502),
        rotatedTokens,
      };
    }

    if (refreshUsed) {
      return { response: unauthenticatedResponse(), rotatedTokens: null };
    }

    const refreshResult = await refreshAuthSession(request);
    if (!refreshResult.ok) {
      return {
        response: refreshResult.type === "invalid"
          ? unauthenticatedResponse()
          : serviceUnavailableResponse(),
        rotatedTokens: null,
      };
    }

    try {
      const personalInfo = await getProfilePersonalInfoFromCore(
        refreshResult.tokens.accessToken,
        request.signal,
      );
      return { email: personalInfo.email, rotatedTokens: refreshResult.tokens };
    } catch (retryError) {
      if (
        retryError instanceof CoreProfileError
        && retryError.type === "http"
        && retryError.status === 401
      ) {
        return { response: unauthenticatedResponse(), rotatedTokens: null };
      }

      return {
        response: retryError instanceof CoreProfileError
          && retryError.type !== "configuration"
          && retryError.type !== "network"
          ? authJson({ error: "upstream_error" }, 502)
          : serviceUnavailableResponse(),
        rotatedTokens: refreshResult.tokens,
      };
    }
  }
}

export async function POST(request: NextRequest) {
  const recoveryRequest = await readRequest(request);
  if (recoveryRequest === null) {
    return authJson({ error: "invalid_request" }, 400);
  }

  let identifier: string;
  let rotatedTokens: CoreAuthTokens | null = null;

  if (recoveryRequest.kind === "profile") {
    const profileEmailResult = await resolveAuthenticatedProfileEmail(request);
    if (profileEmailResult.response) {
      return withRotatedSession(
        profileEmailResult.response,
        profileEmailResult.rotatedTokens,
      );
    }

    identifier = profileEmailResult.email;
    rotatedTokens = profileEmailResult.rotatedTokens;
  } else {
    identifier = recoveryRequest.request.identifier;
  }

  try {
    await requestPasswordRecoveryFromCore({ identifier }, request.signal);
    return withRotatedSession(authJson({ requested: true }), rotatedTokens);
  } catch (error) {
    if (error instanceof CoreRecoveryError) {
      if (
        error.type === "configuration"
        || error.type === "network"
      ) {
        return withRotatedSession(serviceUnavailableResponse(), rotatedTokens);
      }
    }

    return withRotatedSession(authJson({ error: "upstream_error" }, 502), rotatedTokens);
  }
}
