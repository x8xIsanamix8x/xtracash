import type { RecoveryRequest } from "../types";
import { normalizeRecoveryIdentifier } from "../validation";

export type RecoveryServiceErrorType = "aborted" | "http" | "network" | "unauthenticated";

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
  let response: Response;

  try {
    response = await fetch("/api/auth/recovery", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
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

  if (response.status === 401) {
    throw new RecoveryServiceError("unauthenticated");
  }

  if (!response.ok) {
    throw new RecoveryServiceError("http");
  }
}
