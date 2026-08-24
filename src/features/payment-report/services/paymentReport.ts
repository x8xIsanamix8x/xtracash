import {
  parsePaymentReportData,
  parsePaymentReportResult,
} from "../contractValidation";
import type {
  CreatePaymentReportRequest,
  PaymentReportData,
  PaymentReportResult,
} from "../types";

export type PaymentReportServiceErrorType =
  | "aborted"
  | "conflict"
  | "invalid"
  | "network"
  | "server"
  | "unauthenticated"
  | "unconfigured";

export class PaymentReportServiceError extends Error {
  readonly type: PaymentReportServiceErrorType;

  constructor(type: PaymentReportServiceErrorType) {
    super(type);
    this.name = "PaymentReportServiceError";
    this.type = type;
  }
}

async function request(
  pathname: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(pathname, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new PaymentReportServiceError("aborted");
    }
    throw new PaymentReportServiceError("network");
  }

  if (response.status === 401) {
    throw new PaymentReportServiceError("unauthenticated");
  }
  if (response.status === 404) {
    throw new PaymentReportServiceError("unconfigured");
  }
  if (response.status === 400) {
    throw new PaymentReportServiceError("invalid");
  }
  if (response.status === 409) {
    throw new PaymentReportServiceError("conflict");
  }
  if (!response.ok) throw new PaymentReportServiceError("server");

  return response;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new PaymentReportServiceError("invalid");
  }
}

export async function getPaymentReportData(
  signal: AbortSignal,
): Promise<PaymentReportData> {
  const response = await request("/api/payment-report/data", {}, signal);
  const data = parsePaymentReportData(await readJson(response));
  if (data === null) throw new PaymentReportServiceError("invalid");
  return data;
}

export async function createPaymentReport(
  report: CreatePaymentReportRequest,
  signal: AbortSignal,
): Promise<PaymentReportResult> {
  const response = await request(
    "/api/payment-report/reports",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    },
    signal,
  );
  const result = parsePaymentReportResult(await readJson(response));
  if (result === null) throw new PaymentReportServiceError("invalid");
  return result;
}
