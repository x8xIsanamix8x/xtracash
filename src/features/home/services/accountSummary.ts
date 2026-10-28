import { parseHomeAccountSummary } from "../accountSummaryValidation";
import type { HomeAccountSummary } from "../types";

export type AccountSummaryServiceErrorType =
  | "aborted"
  | "invalid"
  | "network"
  | "server"
  | "unauthenticated";

export class AccountSummaryServiceError extends Error {
  readonly type: AccountSummaryServiceErrorType;

  constructor(type: AccountSummaryServiceErrorType) {
    super(type);
    this.name = "AccountSummaryServiceError";
    this.type = type;
  }
}

export async function getAccountSummary(
  signal: AbortSignal,
): Promise<HomeAccountSummary> {
  let response: Response;

  try {
    response = await fetch("/api/home/summary", {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new AccountSummaryServiceError("aborted");
    }
    throw new AccountSummaryServiceError("network");
  }

  if (response.status === 401) {
    throw new AccountSummaryServiceError("unauthenticated");
  }
  if (!response.ok) throw new AccountSummaryServiceError("server");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AccountSummaryServiceError("invalid");
  }

  const summary = parseHomeAccountSummary(body);
  if (summary === null) throw new AccountSummaryServiceError("invalid");
  return summary;
}
