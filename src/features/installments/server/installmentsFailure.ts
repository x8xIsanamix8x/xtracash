import type { InstallmentsBffError } from "../contractValidation";
import type { CoreProblem } from "./coreContracts";

type InstallmentsFailure = Readonly<{
  type: "configuration" | "http" | "network" | "protocol";
  status: number | null;
  problem: CoreProblem | null;
}>;

export type InstallmentsFailureResponse = Readonly<{
  status: 400 | 404 | 409 | 502 | 503;
  body: Readonly<{
    error: InstallmentsBffError | "service_unavailable" | "upstream_error";
    expectedAmountBs?: string;
    reportedAmountBs?: string;
  }>;
}>;

/** Traduce un error de Core a la respuesta del BFF. El 401 lo resuelve la ruta. */
export function getInstallmentsFailureResponse(
  failure: InstallmentsFailure,
): InstallmentsFailureResponse {
  if (failure.type === "configuration" || failure.type === "network") {
    return { status: 503, body: { error: "service_unavailable" } };
  }
  if (failure.type !== "http") {
    return { status: 502, body: { error: "upstream_error" } };
  }

  const code = failure.problem?.code ?? null;

  if (failure.status === 400) {
    if (code === "MONTO_NO_CUADRA") {
      return {
        status: 400,
        body: {
          error: "amount_mismatch",
          ...(failure.problem?.expectedAmountBs
            ? { expectedAmountBs: failure.problem.expectedAmountBs }
            : {}),
          ...(failure.problem?.reportedAmountBs
            ? { reportedAmountBs: failure.problem.reportedAmountBs }
            : {}),
        },
      };
    }
    if (code === "TASA_NO_DISPONIBLE") {
      return { status: 400, body: { error: "rate_unavailable" } };
    }
    if (code === "SIN_DEUDA") {
      return { status: 400, body: { error: "no_debt" } };
    }
    return { status: 400, body: { error: "invalid_request" } };
  }

  if (failure.status === 403 || failure.status === 404) {
    return {
      status: 404,
      body: {
        error: code === "DATOS_PAGO_NO_CONFIGURADOS"
          ? "payment_data_unconfigured"
          : "consumption_not_found",
      },
    };
  }

  if (failure.status === 409) {
    return { status: 409, body: { error: "report_pending" } };
  }

  return { status: 502, body: { error: "upstream_error" } };
}
