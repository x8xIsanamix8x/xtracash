import { formatShortDate } from "../home/newBusinessViewModel";
import { formatBolivars } from "../home/presentation";
import { formatPhone } from "./paymentInstructions";
import type { InstallmentsServiceErrorType } from "./services/installments";
import type { InstallmentReportResult, SourceBank } from "./types";

export type ReportFailure =
  /** Pantalla de error (SPEC-07). */
  | Readonly<{
    kind: "screen";
    reason: string;
    canRetry: boolean;
    showSupport: boolean;
  }>
  /** Error que se corrige en el mismo formulario. */
  | Readonly<{
    kind: "form";
    field: "receipt" | "paymentDate" | null;
    message: string;
  }>;

type FailureAmounts = Readonly<{
  expectedAmountBs: string | null;
  reportedAmountBs: string | null;
}>;

export function getReportFailure(
  type: InstallmentsServiceErrorType,
  amounts: FailureAmounts,
): ReportFailure {
  switch (type) {
    case "amount_mismatch":
      return {
        kind: "screen",
        reason: amounts.expectedAmountBs
          ? `El monto no cubre lo que debías a la fecha del pago (${formatBolivars(amounts.expectedAmountBs)}). Comunícate con soporte.`
          : "El monto no cubre lo que debías a la fecha del pago. Comunícate con soporte.",
        canRetry: true,
        showSupport: true,
      };
    case "report_pending":
      return {
        kind: "screen",
        reason: "Ya tienes un pago en validación para este consumo. Espera a que el equipo lo revise.",
        canRetry: false,
        showSupport: false,
      };
    case "no_debt":
    case "not_found":
      return {
        kind: "screen",
        reason: "Este consumo no tiene deuda pendiente.",
        canRetry: false,
        showSupport: false,
      };
    case "rate_unavailable":
      return {
        kind: "form",
        field: "paymentDate",
        message: "No hay tasa registrada para esa fecha. Elige otra fecha.",
      };
    case "invalid_support":
      return { kind: "form", field: "receipt", message: "El comprobante no es válido. Selecciona otro archivo." };
    case "support_too_large":
      return { kind: "form", field: "receipt", message: "El comprobante supera los 5 MB. Selecciona otro archivo." };
    case "invalid":
      return { kind: "form", field: null, message: "Revisa los datos e inténtalo nuevamente." };
    case "network":
      return {
        kind: "screen",
        reason: "Ocurrió un problema de conexión. Revisa tu internet e inténtalo nuevamente.",
        canRetry: true,
        showSupport: false,
      };
    default:
      return {
        kind: "screen",
        reason: "Ocurrió un problema al enviar el reporte. Inténtalo nuevamente.",
        canRetry: true,
        showSupport: false,
      };
  }
}

export type SuccessSummaryInput = Readonly<{
  consumptionLabel: string;
  installmentsLabel: string;
  senderBank: string;
  sourceBanks: readonly SourceBank[];
  bankReference: string;
  senderPhone: string;
  result: InstallmentReportResult;
}>;

/** Filas de Figma 18: producto, cuota, banco, referencia, fecha, teléfono y monto reportado. */
export function createSuccessRows(input: SuccessSummaryInput) {
  const bank = input.sourceBanks.find((item) => item.code === input.senderBank);
  return [
    { label: "Producto", value: input.consumptionLabel },
    { label: "Cuota reportada", value: input.installmentsLabel },
    { label: "Banco", value: bank ? bank.name : input.senderBank },
    { label: "Referencia", value: input.bankReference },
    { label: "Fecha", value: formatShortDate(input.result.paymentDate) },
    { label: "Teléfono", value: formatPhone(input.senderPhone) },
    { label: "Monto reportado", value: formatBolivars(input.result.reportedAmountBs) },
  ] as const;
}

/** "Cuota 01" o "Cuotas 01 a 03" a partir de los números que cubre la opción. */
export function formatReportedInstallments(installments: readonly number[]): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const first = installments[0];
  const last = installments[installments.length - 1];
  return first === last ? `Cuota ${pad(first)}` : `Cuotas ${pad(first)} a ${pad(last)}`;
}
