import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import type { RecoveryRequest } from "../types";
import {
  createCoreRecoveryEndpoint,
  isSuccessfulRecoveryStatus,
  parseCoreRecoveryResponse,
} from "../validation";

export type CoreRecoveryErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

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

  return createCoreRecoveryEndpoint(configuration.baseUrl);
}

export async function requestPasswordRecoveryFromCore(
  request: RecoveryRequest,
  signal: AbortSignal,
): Promise<void> {
  const endpoint = getRecoveryEndpoint();
  const requestInit: RequestInit = {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  };
  let response: Response;

  try {
    response = await fetch(endpoint, requestInit);
  } catch {
    throw new CoreRecoveryError("network");
  }

  if (!isSuccessfulRecoveryStatus(response.status)) {
    throw new CoreRecoveryError("http", response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CoreRecoveryError("protocol", response.status);
  }

  if (parseCoreRecoveryResponse(body) === null) {
    throw new CoreRecoveryError("protocol", response.status);
  }
}
