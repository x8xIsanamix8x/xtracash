import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import type { RecoveryRequest } from "../types";

export type CoreRecoveryErrorType = "configuration" | "http" | "network";

export class CoreRecoveryError extends Error {
  readonly type: CoreRecoveryErrorType;
  readonly status: number | null;

  constructor(type: CoreRecoveryErrorType, status: number | null = null) {
    super(type);
    this.name = "CoreRecoveryError";
    this.type = type;
    this.status = status;
  }
}

function getRecoveryEndpoint(): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new CoreRecoveryError("configuration");

  return `${configuration.baseUrl}/api/recuperacion`;
}

export async function requestPasswordRecoveryFromCore(
  request: RecoveryRequest,
  signal: AbortSignal,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(getRecoveryEndpoint(), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof CoreRecoveryError) throw error;
    throw new CoreRecoveryError("network");
  }

  if (response.status !== 200) {
    throw new CoreRecoveryError("http", response.status);
  }
}
