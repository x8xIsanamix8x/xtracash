import { getCoreApiBaseUrl } from "@/config/coreApi";

import type { RecoveryRequest } from "../types";
import { normalizeRecoveryIdentifier } from "../validation";

export type RecoveryServiceErrorType = "aborted" | "configuration" | "http" | "network";

export class RecoveryServiceError extends Error {
  readonly type: RecoveryServiceErrorType;

  constructor(type: RecoveryServiceErrorType) {
    super(type);
    this.name = "RecoveryServiceError";
    this.type = type;
  }
}

export function createRecoveryRequest(identifier: string): RecoveryRequest {
  return { identifier: normalizeRecoveryIdentifier(identifier) };
}

export async function requestPasswordRecovery(
  request: RecoveryRequest,
  signal: AbortSignal,
): Promise<void> {
  const configuration = getCoreApiBaseUrl();

  if (!configuration.ok) {
    throw new RecoveryServiceError(configuration.error.type);
  }

  let response: Response;

  try {
    response = await fetch(`${configuration.baseUrl}/api/recuperacion`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new RecoveryServiceError("aborted");
    }

    throw new RecoveryServiceError("network");
  }

  if (!response.ok) {
    throw new RecoveryServiceError("http");
  }
}
