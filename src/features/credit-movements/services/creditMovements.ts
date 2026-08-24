import { parseCreditMovementsPage } from "../contractValidation";
import type {
  CreditMovementQuery,
  CreditMovementsPage,
} from "../types";

export type CreditMovementsServiceErrorType =
  | "aborted"
  | "invalid"
  | "network"
  | "server"
  | "unauthenticated";

export class CreditMovementsServiceError extends Error {
  readonly type: CreditMovementsServiceErrorType;

  constructor(type: CreditMovementsServiceErrorType) {
    super(type);
    this.name = "CreditMovementsServiceError";
    this.type = type;
  }
}

function createQueryString(query: CreditMovementQuery): string {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });
  if (query.type) searchParams.set("tipo", query.type);
  if (query.status) searchParams.set("estado", query.status);
  if (query.from) searchParams.set("desde", query.from);
  if (query.to) searchParams.set("hasta", query.to);
  return searchParams.toString();
}

export async function getCreditMovements(
  query: CreditMovementQuery,
  signal: AbortSignal,
): Promise<CreditMovementsPage> {
  let response: Response;

  try {
    response = await fetch(
      `/api/credit-movements?${createQueryString(query)}`,
      {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      },
    );
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new CreditMovementsServiceError("aborted");
    }
    throw new CreditMovementsServiceError("network");
  }

  if (response.status === 401) {
    throw new CreditMovementsServiceError("unauthenticated");
  }
  if (response.status === 400) {
    throw new CreditMovementsServiceError("invalid");
  }
  if (!response.ok) throw new CreditMovementsServiceError("server");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CreditMovementsServiceError("invalid");
  }

  const page = parseCreditMovementsPage(body);
  if (page === null) throw new CreditMovementsServiceError("invalid");
  return page;
}
