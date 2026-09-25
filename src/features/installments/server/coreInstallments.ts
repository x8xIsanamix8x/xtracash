import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import type {
  ConsumptionDetail,
  CreateInstallmentReportRequest,
  InstallmentReportResult,
  InstallmentsOverview,
  PaymentData,
} from "../types";
import {
  combineInstallmentsOverview,
  parseCoreBanks,
  parseCoreConsumptionDetail,
  parseCoreFinancings,
  parseCorePaymentData,
  parseCoreProblem,
  parseCoreReportCreated,
  parseCoreUnpaidInstallments,
} from "./coreContracts";
import type { CoreProblem } from "./coreContracts";

export type CoreInstallmentsErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

export class CoreInstallmentsError extends Error {
  readonly type: CoreInstallmentsErrorType;
  readonly status: number | null;
  readonly problem: CoreProblem | null;

  constructor(
    type: CoreInstallmentsErrorType,
    status: number | null = null,
    problem: CoreProblem | null = null,
  ) {
    super(type);
    this.name = "CoreInstallmentsError";
    this.type = type;
    this.status = status;
    this.problem = problem;
  }
}

type CoreRequestOptions = Readonly<{
  accessToken?: string;
  body?: unknown;
  method?: "GET" | "POST";
  signal: AbortSignal;
}>;

async function requestCore(
  pathname: string,
  { accessToken, body, method = "GET", signal }: CoreRequestOptions,
): Promise<Response> {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new CoreInstallmentsError("configuration");

  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    return await fetch(`${configuration.baseUrl}${pathname}`, {
      method,
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new CoreInstallmentsError("network");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CoreInstallmentsError("protocol");
  }
}

async function readOk(response: Response, expectedStatus = 200): Promise<unknown> {
  if (response.status === expectedStatus) return readJson(response);

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Sin cuerpo JSON: el error se clasifica solo por el estado HTTP.
  }
  throw new CoreInstallmentsError("http", response.status, parseCoreProblem(body));
}

function parsedOrThrow<T>(value: T | null): T {
  if (value === null) throw new CoreInstallmentsError("protocol");
  return value;
}

export async function getInstallmentsFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<InstallmentsOverview> {
  const [financingsResponse, installmentsResponse] = await Promise.all([
    requestCore("/api/impulsate-movil/financiamientos", { accessToken, signal }),
    requestCore("/api/impulsate-movil/cuotas", { accessToken, signal }),
  ]);
  const [financingsBody, installmentsBody] = await Promise.all([
    readOk(financingsResponse),
    readOk(installmentsResponse),
  ]);

  return combineInstallmentsOverview(
    parsedOrThrow(parseCoreFinancings(financingsBody)),
    parsedOrThrow(parseCoreUnpaidInstallments(installmentsBody)),
  );
}

export async function getConsumptionDetailFromCore(
  accessToken: string,
  consumptionId: string,
  signal: AbortSignal,
): Promise<ConsumptionDetail> {
  const response = await requestCore(
    `/api/impulsate-movil/consumos/${encodeURIComponent(consumptionId)}`,
    { accessToken, signal },
  );
  return parsedOrThrow(parseCoreConsumptionDetail(await readOk(response)));
}

export async function getPaymentDataFromCore(
  accessToken: string,
  consumptionId: string,
  paymentDate: string | null,
  signal: AbortSignal,
): Promise<PaymentData> {
  const query = new URLSearchParams({ consumptionId });
  if (paymentDate) query.set("paymentDate", paymentDate);

  const [dataResponse, banksResponse] = await Promise.all([
    requestCore(`/api/impulsate-movil/datos-pago?${query}`, { accessToken, signal }),
    requestCore("/api/directorio-bancos", { signal }),
  ]);
  const [dataBody, banksBody] = await Promise.all([
    readOk(dataResponse),
    readOk(banksResponse),
  ]);

  const banks = parsedOrThrow(parseCoreBanks(banksBody));
  return parsedOrThrow(parseCorePaymentData(dataBody, banks));
}

export async function createInstallmentReportInCore(
  accessToken: string,
  consumptionId: string,
  report: CreateInstallmentReportRequest,
  signal: AbortSignal,
): Promise<InstallmentReportResult> {
  const response = await requestCore("/api/impulsate-movil/reportes-pago", {
    accessToken,
    method: "POST",
    body: {
      consumptionId,
      option: report.option,
      ...(report.option === "CUOTAS"
        ? { installmentCount: report.installmentCount }
        : {}),
      amount: Number(report.amountBs),
      senderBank: report.senderBank,
      senderPhone: report.senderPhone,
      paymentDate: report.paymentDate,
      bankReference: report.bankReference,
      ...(report.receipt ? { receipt: report.receipt } : {}),
    },
    signal,
  });

  return parsedOrThrow(
    parseCoreReportCreated(await readOk(response, 201), Boolean(report.receipt)),
  );
}
