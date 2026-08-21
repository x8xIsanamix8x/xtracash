import type {
  Bank,
  ConfirmedPayment,
  DirectoryContact,
  DocumentType,
  InitiatedPayment,
  MobilePaymentOptions,
  ResolvedRecipient,
} from "./types";

const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const documentTypes = new Set(["V", "J"]);
const channels = new Set(["MISMO_BANCO", "OTRA_ENTIDAD"]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function isAmountString(value: unknown): value is string {
  return typeof value === "string" && amountPattern.test(value);
}

function isDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseDocumentType(value: unknown): DocumentType | null {
  return typeof value === "string" && documentTypes.has(value)
    ? value as DocumentType
    : null;
}

function parseBank(value: unknown): Bank | null {
  if (!isRecord(value) || !isNonEmptyString(value.code) || !isNonEmptyString(value.name)) {
    return null;
  }

  return { code: value.code.trim(), name: value.name.trim() };
}

function parseDirectoryContact(value: unknown): DirectoryContact | null {
  if (!isRecord(value) || !isUuid(value.id)) return null;

  const documentType = parseDocumentType(value.documentType);
  if (
    documentType === null
    || !isNonEmptyString(value.name)
    || !isNonEmptyString(value.bankCode)
    || !isNonEmptyString(value.documentNumber)
    || !isNonEmptyString(value.phone)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name.trim(),
    bankCode: value.bankCode.trim(),
    documentType,
    documentNumber: value.documentNumber.trim(),
    phone: value.phone.trim(),
  };
}

function parseRecipient(value: unknown): ResolvedRecipient | null {
  if (!isRecord(value)) return null;

  const documentType = parseDocumentType(value.documentType);
  if (
    documentType === null
    || !isNonEmptyString(value.name)
    || !isNonEmptyString(value.bankCode)
    || !isNonEmptyString(value.documentNumber)
    || !isNonEmptyString(value.phone)
    || (value.id !== null && !isUuid(value.id))
    || typeof value.saveToDirectory !== "boolean"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name.trim(),
    bankCode: value.bankCode.trim(),
    documentType,
    documentNumber: value.documentNumber.trim(),
    phone: value.phone.trim(),
    saveToDirectory: value.saveToDirectory,
  };
}

export function parseMobilePaymentOptions(value: unknown): MobilePaymentOptions | null {
  if (!isRecord(value) || !Array.isArray(value.banks) || !Array.isArray(value.contacts)) {
    return null;
  }

  const banks = value.banks.map(parseBank);
  const contacts = value.contacts.map(parseDirectoryContact);
  if (banks.some((bank) => bank === null) || contacts.some((contact) => contact === null)) {
    return null;
  }

  return {
    banks: banks as readonly Bank[],
    contacts: contacts as readonly DirectoryContact[],
  };
}

export function parseInitiatedPayment(value: unknown): InitiatedPayment | null {
  if (!isRecord(value)) return null;

  const recipient = parseRecipient(value.recipient);
  if (
    !isUuid(value.operationId)
    || !isNonEmptyString(value.status)
    || typeof value.channel !== "string"
    || !channels.has(value.channel)
    || !isAmountString(value.amountBs)
    || !isAmountString(value.feeBs)
    || !isNonEmptyString(value.feePercentage)
    || !isAmountString(value.totalBs)
    || !isNonEmptyString(value.rateValue)
    || !isNonEmptyString(value.rateDate)
    || !isNonEmptyString(value.rateSource)
    || !isDateTime(value.expiresAt)
    || !isAmountString(value.availableBs)
    || recipient === null
  ) {
    return null;
  }

  return {
    operationId: value.operationId,
    status: value.status.trim(),
    channel: value.channel as InitiatedPayment["channel"],
    amountBs: value.amountBs,
    feeBs: value.feeBs,
    feePercentage: value.feePercentage.trim(),
    totalBs: value.totalBs,
    rateValue: value.rateValue.trim(),
    rateDate: value.rateDate.trim(),
    rateSource: value.rateSource.trim(),
    expiresAt: value.expiresAt,
    availableBs: value.availableBs,
    recipient,
  };
}

export function parseConfirmedPayment(value: unknown): ConfirmedPayment | null {
  if (!isRecord(value)) return null;
  if (
    !isUuid(value.operationId)
    || !isNonEmptyString(value.status)
    || !isAmountString(value.amountBs)
    || !isAmountString(value.totalBs)
    || (value.bankReference !== null && !isNonEmptyString(value.bankReference))
    || (value.resolvedAt !== null && !isDateTime(value.resolvedAt))
    || (value.message !== null && typeof value.message !== "string")
  ) {
    return null;
  }

  return {
    operationId: value.operationId,
    status: value.status.trim(),
    bankReference: value.bankReference === null ? null : value.bankReference.trim(),
    amountBs: value.amountBs,
    totalBs: value.totalBs,
    resolvedAt: value.resolvedAt,
    message: value.message === null ? null : value.message.trim(),
  };
}
