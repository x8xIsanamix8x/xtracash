import { formatBolivars } from "../home/presentation";
import { isAllowedPaymentDate, isCalendarDate } from "./calendarDate";
import type { PaymentSelection } from "./paymentOptions";
import type { CreateInstallmentReportRequest, PaymentReceipt, SourceBank } from "./types";

const phonePattern = /^04(12|14|16|22|24|26)\d{7}$/;
export const bankReferencePattern = /^\d{4,20}$/;

export type ReportFormValues = Readonly<{
  senderBank: string;
  bankReference: string;
  paymentDate: string;
  senderPhone: string;
  /** Tal como lo escribe el usuario, p. ej. "68744,18". */
  amount: string;
  confirmed: boolean;
}>;

export type ReportFormField = keyof ReportFormValues;

export type ReportFormErrors = Partial<Readonly<Record<ReportFormField, string>>>;

/** Orden de los campos en pantalla: el foco va al primero con error. */
export const reportFormFieldOrder: readonly ReportFormField[] = [
  "senderBank",
  "bankReference",
  "paymentDate",
  "senderPhone",
  "amount",
  "confirmed",
];

export function normalizeReferenceInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 20);
}

export function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/**
 * Lee un monto escrito a la venezolana o con punto decimal y lo devuelve canónico.
 * "68.744,18" → "68744.18", "68744,18" → "68744.18", "68744.18" → "68744.18",
 * "68.744" → "68744.00". Nulo si no es un monto válido (máximo 2 decimales).
 */
export function parseAmountInput(value: string): string | null {
  const text = value.replace(/\s/g, "").replace(/^Bs\.?/i, "");
  if (!text || !/^[\d.,]+$/.test(text)) return null;

  let integer: string;
  let fraction = "";
  if (text.includes(",")) {
    const parts = text.split(",");
    if (parts.length !== 2) return null;
    integer = parts[0].replace(/\./g, "");
    fraction = parts[1];
  } else {
    const match = /^(.*)\.(\d{1,2})$/.exec(text);
    if (match && !match[1].includes(".")) {
      integer = match[1];
      fraction = match[2];
    } else {
      integer = text.replace(/\./g, "");
    }
  }

  if (!/^\d+$/.test(integer) || !/^\d{0,2}$/.test(fraction)) return null;
  const normalizedInteger = integer.replace(/^0+(?=\d)/, "");
  if (normalizedInteger.length > 13) return null;
  return `${normalizedInteger}.${fraction.padEnd(2, "0")}`;
}

/** "68744.18" → "68744,18" para mostrarlo en el campo. */
export function formatAmountInput(amountBs: string): string {
  return amountBs.replace(".", ",");
}

function toCents(amountBs: string): bigint {
  return BigInt(amountBs.replace(".", ""));
}

export function compareAmounts(left: string, right: string): number {
  const difference = toCents(left) - toCents(right);
  return difference === BigInt(0) ? 0 : difference > BigInt(0) ? 1 : -1;
}

export type ReportFormContext = Readonly<{
  sourceBanks: readonly SourceBank[];
  today: string;
  /** Día del consumo: no se puede haber pagado antes. */
  minDate: string;
  /** Lo que cuesta la opción a la fecha elegida; nulo mientras se calcula. */
  expectedAmountBs: string | null;
}>;

export function validatePaymentDate(value: string, context: Pick<ReportFormContext, "today" | "minDate">) {
  if (!isCalendarDate(value)) return "Selecciona la fecha en que hiciste el pago.";
  if (!isAllowedPaymentDate(value, context.today)) return "La fecha del pago no puede ser futura.";
  if (value < context.minDate) return "La fecha no puede ser anterior al consumo.";
  return null;
}

export function validateReportForm(
  values: ReportFormValues,
  context: ReportFormContext,
): ReportFormErrors {
  const errors: Partial<Record<ReportFormField, string>> = {};

  if (!context.sourceBanks.some((bank) => bank.code === values.senderBank)) {
    errors.senderBank = "Selecciona el banco desde el que pagaste.";
  }
  if (!bankReferencePattern.test(values.bankReference)) {
    errors.bankReference = "Ingresa el número de referencia completo (solo números).";
  }
  const dateError = validatePaymentDate(values.paymentDate, context);
  if (dateError) errors.paymentDate = dateError;
  if (!phonePattern.test(values.senderPhone)) {
    errors.senderPhone = "Ingresa un número móvil válido de 11 dígitos (p. ej. 04141234567).";
  }

  const amount = parseAmountInput(values.amount);
  if (amount === null || compareAmounts(amount, "0.00") <= 0) {
    errors.amount = "Ingresa el monto que transferiste.";
  } else if (context.expectedAmountBs && compareAmounts(amount, context.expectedAmountBs) < 0) {
    errors.amount = `El monto no puede ser menor a ${formatBolivars(context.expectedAmountBs)}.`;
  }

  if (!values.confirmed) {
    errors.confirmed = "Confirma que el monto corresponde a la opción seleccionada.";
  }

  return errors;
}

export function firstErrorField(errors: ReportFormErrors): ReportFormField | null {
  return reportFormFieldOrder.find((field) => errors[field]) ?? null;
}

export function toCreateReportRequest(
  values: ReportFormValues,
  selection: PaymentSelection,
  receipt?: PaymentReceipt,
): CreateInstallmentReportRequest {
  const amountBs = parseAmountInput(values.amount);
  if (amountBs === null) throw new Error("invalid_amount");

  return {
    option: selection.option,
    ...(selection.option === "CUOTAS" ? { installmentCount: selection.installmentCount } : {}),
    amountBs,
    senderBank: values.senderBank,
    senderPhone: values.senderPhone,
    paymentDate: values.paymentDate,
    bankReference: values.bankReference,
    ...(receipt ? { receipt } : {}),
  };
}
