import "server-only";

import {
  getCaracasCalendarDate,
  isAllowedPaymentDate,
} from "../calendarDate";
import { isRecord } from "../contractValidation";
import type { CreatePaymentReportRequest } from "../types";
import { parsePaymentSupport } from "./paymentSupportValidation";

const amountPattern = /^(0|[1-9]\d*)\.(\d{2})$/;
const phonePattern = /^04(12|14|16|22|24|26)\d{7}$/;

function isPositiveSafeAmount(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = amountPattern.exec(value);
  if (!match) return false;

  const minorUnitsText = `${match[1]}${match[2]}`;
  if (minorUnitsText.length > 16) return false;

  const minorUnits = BigInt(minorUnitsText);
  return minorUnits > BigInt(0)
    && minorUnits <= BigInt(Number.MAX_SAFE_INTEGER);
}

export function parseCreatePaymentReportRequest(
  value: unknown,
  today = getCaracasCalendarDate(),
): CreatePaymentReportRequest | null {
  const result = validateCreatePaymentReportRequest(value, today);
  return result.ok ? result.value : null;
}

export type CreatePaymentReportRequestValidation =
  | Readonly<{ ok: true; value: CreatePaymentReportRequest }>
  | Readonly<{
    error: "invalid_payment_support" | "invalid_request" | "payment_support_too_large";
    ok: false;
  }>;

export function validateCreatePaymentReportRequest(
  value: unknown,
  today = getCaracasCalendarDate(),
): CreatePaymentReportRequestValidation {
  if (
    !isRecord(value)
    || !isPositiveSafeAmount(value.amountBs)
    || typeof value.originBankCode !== "string"
    || !/^\d{4}$/.test(value.originBankCode)
    || typeof value.senderPhone !== "string"
    || !phonePattern.test(value.senderPhone)
    || typeof value.paymentDate !== "string"
    || !isAllowedPaymentDate(value.paymentDate, today)
    || typeof value.bankReference !== "string"
    || !/^\d{4}$/.test(value.bankReference)
  ) {
    return { ok: false, error: "invalid_request" };
  }

  let support: CreatePaymentReportRequest["support"];
  if (value.support !== undefined) {
    const supportResult = parsePaymentSupport(value.support);
    if (!supportResult.ok) {
      return {
        ok: false,
        error: supportResult.error === "too_large"
          ? "payment_support_too_large"
          : "invalid_payment_support",
      };
    }
    support = supportResult.value;
  }

  return {
    ok: true,
    value: {
      amountBs: value.amountBs,
      originBankCode: value.originBankCode,
      senderPhone: value.senderPhone,
      paymentDate: value.paymentDate,
      bankReference: value.bankReference,
      ...(support ? { support } : {}),
    },
  };
}

export function toCoreAmountNumber(amountBs: string): number {
  return Number(amountBs);
}
