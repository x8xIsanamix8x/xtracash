import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import type {
  CreditMovementQuery,
  CreditMovementsPage,
} from "../types";
import { parseCoreCreditMovements } from "./coreContractValidation";

export type CoreCreditMovementsErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

export class CoreCreditMovementsError extends Error {
  readonly type: CoreCreditMovementsErrorType;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(
    type: CoreCreditMovementsErrorType,
    status: number | null = null,
    detail: string | null = null,
  ) {
    super(type);
    this.name = "CoreCreditMovementsError";
    this.type = type;
    this.status = status;
    this.detail = detail;
  }
}

function getEndpoint(query: CreditMovementQuery): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) {
    throw new CoreCreditMovementsError("configuration");
  }

  const searchParams = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });
  if (query.type) searchParams.set("type", query.type);
  if (query.status) searchParams.set("status", query.status);
  if (query.from) searchParams.set("from", query.from);
  if (query.to) searchParams.set("to", query.to);
  if (query.q) searchParams.set("q", query.q);

  return `${configuration.baseUrl}/api/impulsate-movil/movimientos?${searchParams}`;
}

export async function getCreditMovementsFromCore(
  accessToken: string,
  query: CreditMovementQuery,
  signal: AbortSignal,
): Promise<CreditMovementsPage> {
  let response: Response;

  try {
    response = await fetch(getEndpoint(query), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
  } catch (error) {
    if (error instanceof CoreCreditMovementsError) throw error;
    throw new CoreCreditMovementsError("network");
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      detail = (await response.text()).slice(0, 500);
    } catch {
      detail = null;
    }
    throw new CoreCreditMovementsError("http", response.status, detail);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CoreCreditMovementsError("protocol");
  }

  const page = parseCoreCreditMovements(body);
  if (page === null) {
    throw new CoreCreditMovementsError(
      "protocol",
      response.status,
      JSON.stringify(body).slice(0, 500),
    );
  }
  return page;
}
