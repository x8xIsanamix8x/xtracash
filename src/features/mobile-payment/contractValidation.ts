import type {
  Bank,
  ConfirmedPayment,
  DirectoryContact,
  DocumentType,
  FinancingInstallment,
  FinancingPlan,
  InitiatedPayment,
  MobilePaymentAccessStatus,
  MobilePaymentContext,
  MobilePaymentOptions,
  PaymentIconId,
  ResolvedRecipient,
} from "./types";

const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const decimalPattern = /^\d+(?:\.\d{1,4})?$/;
const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const documentTypes = new Set(["V", "J"]);
const channels = new Set(["MISMO_BANCO", "OTRA_ENTIDAD"]);
const accessStatuses = new Set(["active", "suspended", "blocked"]);
const paymentIconIds = new Set([
  "school",
  "stethoscope",
  "paw-print",
  "receipt",
  "shopping-cart",
  "car",
  "house",
  "shopping-bag",
  "briefcase",
  "shapes",
]);

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

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const match = calendarDatePattern.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isDecimal(value: unknown): value is string {
  return typeof value === "string" && decimalPattern.test(value);
}

function parsePaymentIconId(value: unknown): PaymentIconId | null | undefined {
  if (value === null) return null;
  return typeof value === "string" && paymentIconIds.has(value)
    ? value as PaymentIconId
    : undefined;
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

function parseConfirmedRecipient(
  value: unknown,
): ConfirmedPayment["recipient"] | null {
  if (
    !isRecord(value)
    || !isNonEmptyString(value.name)
    || typeof value.bankCode !== "string"
    || !/^\d{4}$/.test(value.bankCode)
    || !isNonEmptyString(value.phone)
  ) {
    return null;
  }

  return {
    name: value.name.trim(),
    bankCode: value.bankCode,
    phone: value.phone.trim(),
  };
}

function parseFinancingInstallment(
  value: unknown,
): FinancingInstallment | null {
  if (
    !isRecord(value)
    || !isPositiveInteger(value.number)
    || !isCalendarDate(value.dueDate)
    || !isAmountString(value.amountBs)
  ) {
    return null;
  }

  return {
    number: value.number,
    dueDate: value.dueDate,
    amountBs: value.amountBs,
  };
}

function parseFinancingPlan(value: unknown): FinancingPlan | null {
  if (
    !isRecord(value)
    || !isPositiveInteger(value.level)
    || !isPositiveInteger(value.installmentCount)
    || !isAmountString(value.debtBs)
    || !isPositiveInteger(value.paymentEveryDays)
    || !isPositiveInteger(value.totalTermDays)
    || !isNonNegativeInteger(value.interestFreeDays)
    || !isDecimal(value.monthlyInterestRate)
    || !isDecimal(value.dailyInterestRate)
    || !isDecimal(value.annualInterestRate)
    || !isDecimal(value.monthlyLateFeeRate)
    || !isDecimal(value.dailyLateFeeRate)
    || !isAmountString(value.reconnectionFeeBs)
    || !Array.isArray(value.installments)
  ) {
    return null;
  }

  const installments = value.installments.map(parseFinancingInstallment);
  if (installments.some((installment) => installment === null)) return null;

  const parsedInstallments = installments as FinancingInstallment[];
  if (
    new Set(parsedInstallments.map((installment) => installment.number)).size
    !== parsedInstallments.length
  ) {
    return null;
  }

  return {
    level: value.level,
    installmentCount: value.installmentCount,
    debtBs: value.debtBs,
    paymentEveryDays: value.paymentEveryDays,
    totalTermDays: value.totalTermDays,
    interestFreeDays: value.interestFreeDays,
    monthlyInterestRate: value.monthlyInterestRate,
    dailyInterestRate: value.dailyInterestRate,
    annualInterestRate: value.annualInterestRate,
    monthlyLateFeeRate: value.monthlyLateFeeRate,
    dailyLateFeeRate: value.dailyLateFeeRate,
    reconnectionFeeBs: value.reconnectionFeeBs,
    installments: parsedInstallments,
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

export function parseMobilePaymentContext(value: unknown): MobilePaymentContext | null {
  if (!isRecord(value)) return null;

  const options = parseMobilePaymentOptions(value);
  if (
    options === null
    || !isAmountString(value.availableBs)
    || typeof value.accessStatus !== "string"
    || !accessStatuses.has(value.accessStatus)
  ) {
    return null;
  }

  return {
    ...options,
    availableBs: value.availableBs,
    accessStatus: value.accessStatus as MobilePaymentContext["accessStatus"],
  };
}

export function parseMobilePaymentRestriction(
  value: unknown,
): Exclude<MobilePaymentAccessStatus, "active"> | null {
  if (!isRecord(value)) return null;
  return value.accessStatus === "suspended" || value.accessStatus === "blocked"
    ? value.accessStatus
    : null;
}

export function parseInitiatedPayment(value: unknown): InitiatedPayment | null {
  if (!isRecord(value)) return null;

  const recipient = parseRecipient(value.recipient);
  const iconId = parsePaymentIconId(value.iconId);
  const financing = parseFinancingPlan(value.financing);
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
    || !isNonEmptyString(value.label)
    || iconId === undefined
    || !isNonEmptyString(value.recipientBankName)
    || financing === null
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
    label: value.label.trim(),
    iconId,
    recipientBankName: value.recipientBankName.trim(),
    financing,
    recipient,
  };
}

export function parseConfirmedPayment(value: unknown): ConfirmedPayment | null {
  if (!isRecord(value)) return null;
  const recipient = parseConfirmedRecipient(value.recipient);
  if (
    !isUuid(value.operationId)
    || !isNonEmptyString(value.status)
    || typeof value.isPending !== "boolean"
    || !isNonEmptyString(value.label)
    || !isAmountString(value.amountBs)
    || !isAmountString(value.totalBs)
    || !isAmountString(value.feeBs)
    || !isDecimal(value.feePercentage)
    || !isNonEmptyString(value.recipientBankName)
    || recipient === null
    || (value.bankReference !== null && !isNonEmptyString(value.bankReference))
    || (value.resolvedAt !== null && !isDateTime(value.resolvedAt))
    || (value.message !== null && typeof value.message !== "string")
  ) {
    return null;
  }

  return {
    operationId: value.operationId,
    status: value.status.trim(),
    isPending: value.isPending,
    label: value.label.trim(),
    bankReference: value.bankReference === null ? null : value.bankReference.trim(),
    amountBs: value.amountBs,
    totalBs: value.totalBs,
    feeBs: value.feeBs,
    feePercentage: value.feePercentage,
    recipientBankName: value.recipientBankName.trim(),
    recipient,
    resolvedAt: value.resolvedAt,
    message: value.message === null ? null : value.message.trim(),
  };
}
