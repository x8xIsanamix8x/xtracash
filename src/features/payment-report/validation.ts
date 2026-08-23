import { isAllowedPaymentDate } from "./calendarDate";
import type { PaymentReportFormErrors, SourceBank } from "./types";

const phonePattern = /^04(12|14|16|22|24|26)\d{7}$/;

export function normalizeReference(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function normalizeSenderPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function validatePaymentReportForm(
  originBank: string,
  senderPhone: string,
  paymentDate: string,
  reference: string,
  sourceBanks: readonly SourceBank[],
  today: string,
): PaymentReportFormErrors {
  const errors: {
    originBank?: string;
    senderPhone?: string;
    paymentDate?: string;
    reference?: string;
  } = {};

  if (!sourceBanks.some((bank) => bank.code === originBank)) {
    errors.originBank = "Selecciona el banco desde el que realizaste el pago.";
  }

  if (!phonePattern.test(senderPhone)) {
    errors.senderPhone = "Ingresa un número móvil válido de once dígitos.";
  }

  if (!isAllowedPaymentDate(paymentDate, today)) {
    errors.paymentDate = "Selecciona una fecha válida que no sea futura.";
  }

  if (!/^\d{4}$/.test(reference)) {
    errors.reference = "Ingresa exactamente los últimos cuatro dígitos.";
  }

  return errors;
}

export function isPaymentReportFormValid(
  originBank: string,
  senderPhone: string,
  paymentDate: string,
  reference: string,
  sourceBanks: readonly SourceBank[],
  today: string,
): boolean {
  return sourceBanks.some((bank) => bank.code === originBank)
    && phonePattern.test(senderPhone)
    && isAllowedPaymentDate(paymentDate, today)
    && /^\d{4}$/.test(reference);
}
