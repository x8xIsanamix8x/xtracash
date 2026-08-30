import type {
  CorePaymentReportBadRequest,
  CorePaymentReportConflict,
} from "./corePaymentReportResponse";

type PaymentReportFailure = Readonly<{
  type: "configuration" | "http" | "network" | "not_configured" | "protocol";
  status: number | null;
  conflict: CorePaymentReportConflict | null;
  badRequest?: CorePaymentReportBadRequest | null;
}>;

export type PaymentReportFailureResponse = Readonly<{
  status: 400 | 404 | 409 | 502 | 503;
  body: Readonly<{ error: string }>;
}>;

export function getPaymentReportFailureResponse(
  failure: PaymentReportFailure,
): PaymentReportFailureResponse {
  if (failure.type === "configuration") {
    return { status: 503, body: { error: "service_unavailable" } };
  }
  if (failure.type === "not_configured") {
    return { status: 404, body: { error: "payment_data_unconfigured" } };
  }
  if (failure.type === "http" && failure.status === 409) {
    return {
      status: 409,
      body: {
        error: failure.conflict ?? "payment_report_conflict",
      },
    };
  }
  if (failure.type === "http" && failure.status === 400) {
    return {
      status: 400,
      body: {
        error: failure.badRequest === "payment_report_no_debt"
          ? "payment_report_no_debt"
          : "invalid_request",
      },
    };
  }

  return { status: 502, body: { error: "upstream_error" } };
}
