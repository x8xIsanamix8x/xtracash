import type {
  PaymentReportData,
  PaymentReportResult,
  SourceBank,
} from "./types";

const amountPattern = /^(0|[1-9]\d*)\.\d{2}$/;
const bankCodePattern = /^\d{4}$/;

export type PaymentReportBffConflict =
  | "payment_report_conflict"
  | "payment_report_pending";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function isCanonicalAmount(value: unknown): value is string {
  return typeof value === "string" && amountPattern.test(value);
}

function parseSourceBank(value: unknown): SourceBank | null {
  if (
    !isRecord(value)
    || typeof value.code !== "string"
    || !bankCodePattern.test(value.code)
    || !isNonEmptyString(value.name)
  ) {
    return null;
  }

  return { code: value.code, name: value.name.trim() };
}

export function parsePaymentReportData(value: unknown): PaymentReportData | null {
  if (
    !isRecord(value)
    || !isRecord(value.destination)
    || !isRecord(value.debt)
    || !Array.isArray(value.sourceBanks)
    || value.sourceBanks.length === 0
  ) {
    return null;
  }

  const destination = value.destination;
  if (
    !isNonEmptyString(destination.bankName)
    || typeof destination.bankCode !== "string"
    || !bankCodePattern.test(destination.bankCode)
    || !isNonEmptyString(destination.rif)
    || !isNonEmptyString(destination.receiverPhone)
    || !isCanonicalAmount(value.debt.currentBs)
    || !isCanonicalAmount(value.debt.minimumBs)
  ) {
    return null;
  }

  const sourceBanks = value.sourceBanks.map(parseSourceBank);
  if (sourceBanks.some((bank) => bank === null)) return null;

  return {
    destination: {
      bankName: destination.bankName.trim(),
      bankCode: destination.bankCode,
      rif: destination.rif.trim(),
      receiverPhone: destination.receiverPhone.trim(),
    },
    debt: {
      currentBs: value.debt.currentBs,
      minimumBs: value.debt.minimumBs,
    },
    sourceBanks: sourceBanks as readonly SourceBank[],
  };
}

export function parsePaymentReportResult(
  value: unknown,
): PaymentReportResult | null {
  if (
    !isRecord(value)
    || !isCanonicalAmount(value.amountBs)
  ) {
    return null;
  }

  return { amountBs: value.amountBs };
}

export function parsePaymentReportBffConflict(
  value: unknown,
): PaymentReportBffConflict | null {
  if (!isRecord(value)) return null;

  return value.error === "payment_report_pending"
    || value.error === "payment_report_conflict"
    ? value.error
    : null;
}
