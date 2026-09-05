"use client";

import type { BiometricAccessStatus, WebAuthnCapability } from "../types";

type PlatformAuthenticatorApi = Readonly<{
  isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
}>;

export type WebAuthnRuntime = Readonly<{
  hostname: string;
  isSecureContext: boolean;
  protocol: string;
  publicKeyCredential: PlatformAuthenticatorApi | null;
}>;

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "[::1]";
}

export function isSecureWebAuthnContext(
  runtime: Pick<WebAuthnRuntime, "hostname" | "isSecureContext" | "protocol">,
): boolean {
  const allowedOrigin = runtime.protocol === "https:"
    || isLocalHostname(runtime.hostname);

  return allowedOrigin && runtime.isSecureContext;
}

function getBrowserRuntime(): WebAuthnRuntime | null {
  if (typeof window === "undefined") return null;

  return {
    hostname: window.location.hostname,
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    publicKeyCredential: typeof window.PublicKeyCredential === "undefined"
      ? null
      : window.PublicKeyCredential,
  };
}

export async function detectWebAuthnCapability(
  runtime: WebAuthnRuntime | null = getBrowserRuntime(),
): Promise<WebAuthnCapability> {
  const isSecureExecutionContext = runtime !== null
    && isSecureWebAuthnContext(runtime);
  const hasPublicKeyCredential = runtime?.publicKeyCredential !== null
    && runtime?.publicKeyCredential !== undefined;

  if (!runtime || !isSecureExecutionContext || !hasPublicKeyCredential) {
    return {
      hasPublicKeyCredential,
      isSecureExecutionContext,
      platformAuthenticatorAvailable: null,
      status: "unsupported",
    };
  }

  const availabilityCheck = runtime.publicKeyCredential
    ?.isUserVerifyingPlatformAuthenticatorAvailable;

  if (typeof availabilityCheck !== "function") {
    return {
      hasPublicKeyCredential: true,
      isSecureExecutionContext: true,
      platformAuthenticatorAvailable: null,
      status: "unavailable",
    };
  }

  try {
    const platformAuthenticatorAvailable = await availabilityCheck.call(
      runtime.publicKeyCredential,
    );

    return {
      hasPublicKeyCredential: true,
      isSecureExecutionContext: true,
      platformAuthenticatorAvailable,
      status: platformAuthenticatorAvailable ? "supported" : "unavailable",
    };
  } catch {
    return {
      hasPublicKeyCredential: true,
      isSecureExecutionContext: true,
      platformAuthenticatorAvailable: null,
      status: "error",
    };
  }
}

export function getBiometricActionFailureStatus(
  error: unknown,
): Extract<BiometricAccessStatus, "cancelled" | "error"> {
  if (
    error instanceof DOMException
    && ["AbortError", "NotAllowedError"].includes(error.name)
  ) {
    return "cancelled";
  }

  return "error";
}
