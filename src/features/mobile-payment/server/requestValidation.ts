import "server-only";

import { isRecord, isUuid } from "../contractValidation";
import type { InitiatePaymentRequest, ResolvedRecipient } from "../types";

const phonePattern = /^04(12|14|16|22|24|26)\d{7}$/;

export function parseInitiatePaymentRequest(
  value: unknown,
): InitiatePaymentRequest | null {
  if (
    !isRecord(value)
    || !Number.isSafeInteger(value.amountMinorUnits)
    || (value.amountMinorUnits as number) <= 0
    || !isRecord(value.recipient)
  ) {
    return null;
  }

  const candidate = value.recipient;
  const id = candidate.id;
  if (id !== null && !isUuid(id)) return null;
  if (
    typeof candidate.name !== "string"
    || !candidate.name.trim()
    || candidate.name.trim().length > 100
    || typeof candidate.bankCode !== "string"
    || !/^\d{4}$/.test(candidate.bankCode)
    || (candidate.documentType !== "V" && candidate.documentType !== "J")
    || typeof candidate.documentNumber !== "string"
    || !/^\d{6,9}$/.test(candidate.documentNumber)
    || typeof candidate.phone !== "string"
    || !phonePattern.test(candidate.phone)
    || typeof candidate.saveToDirectory !== "boolean"
  ) {
    return null;
  }

  const recipient: ResolvedRecipient = {
    id,
    name: candidate.name.trim(),
    bankCode: candidate.bankCode,
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber,
    phone: candidate.phone,
    saveToDirectory: id === null && candidate.saveToDirectory,
  };

  return {
    amountMinorUnits: value.amountMinorUnits as number,
    recipient,
  };
}
