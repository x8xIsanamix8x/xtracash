import {
  parseConsumptionDetail,
  parseInstallmentReportResult,
  parseInstallmentsBffError,
  parseInstallmentsOverview,
  parsePaymentData,
} from "../contractValidation";
import type {
  ConsumptionDetail,
  CreateInstallmentReportRequest,
  InstallmentReportResult,
  InstallmentsOverview,
  PaymentData,
} from "../types";

export type InstallmentsServiceErrorType =
  | "aborted"
  | "amount_mismatch"
  | "invalid"
  | "invalid_support"
  | "network"
  | "no_debt"
  | "not_found"
  | "rate_unavailable"
  | "report_pending"
  | "server"
  | "support_too_large"
  | "unauthenticated"
  | "unconfigured";

export class InstallmentsServiceError extends Error {
  readonly type: InstallmentsServiceErrorType;
  /** Solo con `amount_mismatch`. */
  readonly expectedAmountBs: string | null;
  readonly reportedAmountBs: string | null;

  constructor(
    type: InstallmentsServiceErrorType,
    amounts: Readonly<{ expectedAmountBs: string | null; reportedAmountBs: string | null }> = {
      expectedAmountBs: null,
      reportedAmountBs: null,
    },
  ) {
    super(type);
    this.name = "InstallmentsServiceError";
    this.type = type;
    this.expectedAmountBs = amounts.expectedAmountBs;
    this.reportedAmountBs = amounts.reportedAmountBs;
  }
}

const errorTypes = {
  amount_mismatch: "amount_mismatch",
  consumption_not_found: "not_found",
  invalid_payment_support: "invalid_support",
  invalid_request: "invalid",
  no_debt: "no_debt",
  payment_data_unconfigured: "unconfigured",
  payment_support_too_large: "support_too_large",
  rate_unavailable: "rate_unavailable",
  report_pending: "report_pending",
} as const satisfies Record<string, InstallmentsServiceErrorType>;

async function request(
  pathname: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<unknown> {
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
      throw new InstallmentsServiceError("aborted");
    }
    throw new InstallmentsServiceError("network");
  }

  if (response.status === 401) throw new InstallmentsServiceError("unauthenticated");

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    if (response.ok) throw new InstallmentsServiceError("invalid");
  }

  if (!response.ok) {
    const error = parseInstallmentsBffError(body);
    if (error) throw new InstallmentsServiceError(errorTypes[error.error], error);
    throw new InstallmentsServiceError(response.status >= 500 ? "server" : "invalid");
  }

  return body;
}

function parsedOrThrow<T>(value: T | null): T {
  if (value === null) throw new InstallmentsServiceError("invalid");
  return value;
}

export async function getInstallments(signal: AbortSignal): Promise<InstallmentsOverview> {
  return parsedOrThrow(parseInstallmentsOverview(
    await request("/api/installments", {}, signal),
  ));
}

export async function getConsumptionDetail(
  consumptionId: string,
  signal: AbortSignal,
): Promise<ConsumptionDetail> {
  return parsedOrThrow(parseConsumptionDetail(
    await request(`/api/installments/${encodeURIComponent(consumptionId)}`, {}, signal),
  ));
}

export async function getPaymentData(
  consumptionId: string,
  paymentDate: string | null,
  signal: AbortSignal,
): Promise<PaymentData> {
  const query = paymentDate ? `?${new URLSearchParams({ paymentDate })}` : "";
  return parsedOrThrow(parsePaymentData(await request(
    `/api/installments/${encodeURIComponent(consumptionId)}/payment-data${query}`,
    {},
    signal,
  )));
}

export async function createInstallmentReport(
  consumptionId: string,
  report: CreateInstallmentReportRequest,
  signal: AbortSignal,
): Promise<InstallmentReportResult> {
  return parsedOrThrow(parseInstallmentReportResult(await request(
    `/api/installments/${encodeURIComponent(consumptionId)}/reports`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    },
    signal,
  )));
}
