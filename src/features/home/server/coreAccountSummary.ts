import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import { parseCoreAccountSummary } from "../accountSummaryValidation";
import type { HomeAccountSummary } from "../types";

export type CoreAccountSummaryErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

export class CoreAccountSummaryError extends Error {
  readonly type: CoreAccountSummaryErrorType;
  readonly status: number | null;

  constructor(type: CoreAccountSummaryErrorType, status: number | null = null) {
    super(type);
    this.name = "CoreAccountSummaryError";
    this.type = type;
    this.status = status;
  }
}

function getSummaryEndpoint(): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) {
    throw new CoreAccountSummaryError("configuration");
  }

  return `${configuration.baseUrl}/api/impulsate-movil/resumen`;
}

export async function getAccountSummaryFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<HomeAccountSummary> {
  let response: Response;

  try {
    response = await fetch(getSummaryEndpoint(), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
  } catch (error) {
    if (error instanceof CoreAccountSummaryError) throw error;
    throw new CoreAccountSummaryError("network");
  }

  if (!response.ok) {
    throw new CoreAccountSummaryError("http", response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CoreAccountSummaryError("protocol");
  }

  const summary = parseCoreAccountSummary(body);
  if (summary === null) throw new CoreAccountSummaryError("protocol");
  return summary;
}
