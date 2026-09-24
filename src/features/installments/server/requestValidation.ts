import {
  getCaracasCalendarDate,
  isAllowedPaymentDate,
} from "@/features/payment-report/calendarDate";
import { parsePaymentSupport } from "@/features/payment-report/server/paymentSupportValidation";

import { isRecord } from "../contractValidation";
import { bankReferencePattern } from "../reportForm";
import type { CreateInstallmentReportRequest, PaymentOptionKind } from "../types";

const amountPattern = /^(0|[1-9]\d*)\.(\d{2})$/;
const phonePattern = /^04(12|14|16|22|24|26)\d{7}$/;
const paymentOptions = new Set<PaymentOptionKind>(["PROXIMA", "CUOTAS", "TODAS"]);

function isPositiveAmount(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = amountPattern.exec(value);
  if (!match) return false;

  const minorUnitsText = `${match[1]}${match[2]}`;
  if (minorUnitsText.length > 15) return false;
  return BigInt(minorUnitsText) > BigInt(0);
}

export type CreateInstallmentReportValidation =
  | Readonly<{ ok: true; value: CreateInstallmentReportRequest }>
  | Readonly<{
    ok: false;
    error: "invalid_payment_support" | "invalid_request" | "payment_support_too_large";
  }>;

export function validateCreateInstallmentReportRequest(
  value: unknown,
  today = getCaracasCalendarDate(),
): CreateInstallmentReportValidation {
  if (
    !isRecord(value)
    || typeof value.option !== "string"
    || !paymentOptions.has(value.option as PaymentOptionKind)
    || !isPositiveAmount(value.amountBs)
    || typeof value.senderBank !== "string"
    || !/^\d{4}$/.test(value.senderBank)
    || typeof value.senderPhone !== "string"
    || !phonePattern.test(value.senderPhone)
    || typeof value.paymentDate !== "string"
    || !isAllowedPaymentDate(value.paymentDate, today)
    || typeof value.bankReference !== "string"
    || !bankReferencePattern.test(value.bankReference)
  ) {
    return { ok: false, error: "invalid_request" };
  }

  const option = value.option as PaymentOptionKind;
  const count = value.installmentCount;
  if (option === "CUOTAS") {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
      return { ok: false, error: "invalid_request" };
    }
  } else if (count !== undefined) {
    return { ok: false, error: "invalid_request" };
  }

  let receipt: CreateInstallmentReportRequest["receipt"];
  if (value.receipt !== undefined) {
    const receiptResult = parsePaymentSupport(value.receipt);
    if (!receiptResult.ok) {
      return {
        ok: false,
        error: receiptResult.error === "too_large"
          ? "payment_support_too_large"
          : "invalid_payment_support",
      };
    }
    receipt = receiptResult.value;
  }

  return {
    ok: true,
    value: {
      option,
      ...(option === "CUOTAS" ? { installmentCount: count as number } : {}),
      amountBs: value.amountBs as string,
      senderBank: value.senderBank,
      senderPhone: value.senderPhone,
      paymentDate: value.paymentDate,
      bankReference: value.bankReference,
      ...(receipt ? { receipt } : {}),
    },
  };
}

/** `?paymentDate=` es opcional; si viene, debe ser una fecha válida no futura. */
export function parsePaymentDateQuery(
  value: string | null,
  today = getCaracasCalendarDate(),
): Readonly<{ ok: true; value: string | null }> | Readonly<{ ok: false }> {
  if (value === null || value === "") return { ok: true, value: null };
  return isAllowedPaymentDate(value, today) ? { ok: true, value } : { ok: false };
}
