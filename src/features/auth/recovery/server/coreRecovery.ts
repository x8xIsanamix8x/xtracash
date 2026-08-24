import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import { isRetryableRecoveryConnectionError } from "../network";
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
  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(endpoint, requestInit);
      break;
    } catch (error) {
      const canRetry = attempt === 0
        && !signal.aborted
        && isRetryableRecoveryConnectionError(error);
      if (canRetry) continue;

      throw new CoreRecoveryError("network");
    }
  }

  if (response === null) throw new CoreRecoveryError("network");

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
