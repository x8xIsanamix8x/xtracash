import { temporarySourceBanks } from "./data/paymentReport";
import type { PaymentReportFormErrors } from "./types";

export function normalizeReference(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function validatePaymentReportForm(
  originBank: string,
  reference: string,
): PaymentReportFormErrors {
  const errors: {
    originBank?: string;
    reference?: string;
  } = {};

  if (!temporarySourceBanks.some((bank) => bank.code === originBank)) {
    errors.originBank = "Selecciona el banco desde el que realizaste el pago.";
  }

  if (!/^\d{4}$/.test(reference)) {
    errors.reference = "Ingresa exactamente los últimos cuatro dígitos.";
  }

  return errors;
}

export function isPaymentReportFormValid(
  originBank: string,
  reference: string,
): boolean {
  return temporarySourceBanks.some((bank) => bank.code === originBank)
    && /^\d{4}$/.test(reference);
}
