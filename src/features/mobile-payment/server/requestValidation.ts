import "server-only";

import { isRecord, isUuid } from "../contractValidation";
import { parsePaymentPurpose } from "../paymentPurpose";
import type { InitiatePaymentRequest, ResolvedRecipient } from "../types";

const phonePattern = /^04(12|14|16|22|24|26)\d{7}$/;

function parseAmountBs(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const minorUnits = Math.round(value * 100);
  if (
    !Number.isSafeInteger(minorUnits)
    || Math.abs(value - minorUnits / 100) > 1e-9
  ) {
    return null;
  }

  return minorUnits;
}

function parseNewRecipient(
  candidate: Record<string, unknown>,
): ResolvedRecipient | null {
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
    || typeof candidate.guardarEnDirectorio !== "boolean"
  ) {
    return null;
  }

  return {
    id: null,
    name: candidate.name.trim(),
    bankCode: candidate.bankCode,
    documentType: candidate.documentType,
    documentNumber: candidate.documentNumber,
    phone: candidate.phone,
    saveToDirectory: candidate.guardarEnDirectorio,
  };
}

function parseCoreInitiatePaymentRequest(
  value: Record<string, unknown>,
): InitiatePaymentRequest | null {
  const amountMinorUnits = parseAmountBs(value.montoBs);
  const purpose = parsePaymentPurpose({
    concept: value.etiqueta === undefined ? "" : value.etiqueta,
    iconId: value.icono === undefined ? null : value.icono,
  });
  const hasSavedBeneficiary = "beneficiarioId" in value;
  const hasNewBeneficiary = "beneficiarioNuevo" in value;

  if (
    amountMinorUnits === null
    || purpose === null
    || hasSavedBeneficiary === hasNewBeneficiary
  ) {
    return null;
  }

  let recipient: ResolvedRecipient | null;
  if (hasSavedBeneficiary) {
    if (!isUuid(value.beneficiarioId)) return null;
    recipient = {
      id: value.beneficiarioId,
      name: "",
      bankCode: "",
      documentType: "V",
      documentNumber: "",
      phone: "",
      saveToDirectory: false,
    };
  } else {
    recipient = isRecord(value.beneficiarioNuevo)
      ? parseNewRecipient(value.beneficiarioNuevo)
      : null;
  }

  return recipient === null
    ? null
    : { amountMinorUnits, ...purpose, recipient };
}

function parseInternalInitiatePaymentRequest(
  value: Record<string, unknown>,
): InitiatePaymentRequest | null {
  const purpose = parsePaymentPurpose(value);
  if (
    !Number.isSafeInteger(value.amountMinorUnits)
    || (value.amountMinorUnits as number) <= 0
    || purpose === null
    || !isRecord(value.recipient)
  ) {
    return null;
  }

  const candidate = value.recipient;
  const id = candidate.id;
  if (id !== null && !isUuid(id)) return null;
  const recipient = parseNewRecipient({
    ...candidate,
    guardarEnDirectorio: candidate.saveToDirectory,
  });
  if (recipient === null) return null;

  return {
    amountMinorUnits: value.amountMinorUnits as number,
    ...purpose,
    recipient: {
      ...recipient,
      id,
      saveToDirectory: id === null && recipient.saveToDirectory,
    },
  };
}

export function parseInitiatePaymentRequest(
  value: unknown,
): InitiatePaymentRequest | null {
  if (!isRecord(value)) return null;
  return "montoBs" in value
    ? parseCoreInitiatePaymentRequest(value)
    : parseInternalInitiatePaymentRequest(value);
}
