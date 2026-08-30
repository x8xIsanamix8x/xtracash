import {
  parsePaymentReportBffError,
  parsePaymentReportBffConflict,
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
  | "invalid_support"
  | "network"
  | "no_debt"
  | "pending"
  | "server"
  | "support_too_large"
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
  if (response.status === 400 || response.status === 413) {
    let error = null;
    try {
      error = parsePaymentReportBffError(await response.json());
    } catch {
      // A malformed response remains a safe, generic validation error.
    }
    if (error === "invalid_payment_support") {
      throw new PaymentReportServiceError("invalid_support");
    }
    if (error === "payment_support_too_large") {
      throw new PaymentReportServiceError("support_too_large");
    }
    if (error === "payment_report_no_debt") {
      throw new PaymentReportServiceError("no_debt");
    }
    throw new PaymentReportServiceError("invalid");
  }
  if (response.status === 409) {
    let conflict = null;
    try {
      conflict = parsePaymentReportBffConflict(await response.json());
    } catch {
      // A malformed error response remains a safe, generic conflict.
    }
    throw new PaymentReportServiceError(
      conflict === "payment_report_pending" ? "pending" : "conflict",
    );
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
