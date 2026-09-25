import { normalizePaymentIconId } from "../mobile-payment/paymentPurpose";
import type {
  ConsumptionDetail,
  ConsumptionStatus,
  InstallmentReportResult,
  InstallmentStatus,
  InstallmentsConsumption,
  InstallmentsOverview,
  Money,
  PaymentData,
  PaymentOption,
  PendingInstallment,
  ScheduleInstallment,
  SourceBank,
} from "./types";

const decimalPattern = /^(\d+)(?:\.(\d+))?$/;
const calendarDatePattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bankCodePattern = /^\d{4}$/;

const installmentStatuses = new Set<InstallmentStatus>([
  "PENDIENTE",
  "VENCIDA",
  "EN_MORA",
  "EN_REVISION",
  "PAGADA",
]);
const consumptionStatuses = new Set<ConsumptionStatus>([
  "AL_DIA",
  "VENCIDO_SIN_MORA",
  "VENCIDO_CON_MORA",
  "PAGADO",
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

export function isCalendarDateString(value: unknown): value is string {
  return typeof value === "string" && calendarDatePattern.test(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Lleva un decimal de Core a dos decimales, redondeando la mitad hacia arriba.
 * `"3353.7900"` → `"3353.79"`, `"12.5"` → `"12.50"`.
 */
export function normalizeAmount(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = decimalPattern.exec(value);
  if (!match) return null;

  const fraction = match[2] ?? "";
  let minorUnits = BigInt(`${match[1]}${fraction.padEnd(2, "0").slice(0, 2)}`);
  if (fraction.length > 2 && fraction[2] >= "5") minorUnits += BigInt(1);

  const digits = minorUnits.toString().padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function parseMoney(value: unknown): Money | null {
  if (!isRecord(value)) return null;
  const bs = normalizeAmount(value.bs);
  const usd = normalizeAmount(value.usd);
  return bs === null || usd === null ? null : { bs, usd };
}

export function parseInstallmentStatus(value: unknown): InstallmentStatus | null {
  return typeof value === "string" && installmentStatuses.has(value as InstallmentStatus)
    ? value as InstallmentStatus
    : null;
}

export function parseConsumptionStatus(value: unknown): ConsumptionStatus | null {
  return typeof value === "string" && consumptionStatuses.has(value as ConsumptionStatus)
    ? value as ConsumptionStatus
    : null;
}

export function parseIcon(value: unknown) {
  return normalizePaymentIconId(value) ?? "receipt";
}

function parseNullable<T>(value: unknown, parse: (value: unknown) => T | null) {
  if (value === null || value === undefined) return { ok: true as const, value: null };
  const parsed = parse(value);
  return parsed === null
    ? { ok: false as const }
    : { ok: true as const, value: parsed };
}

function parseList<T>(value: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.map(parse);
  return items.some((item) => item === null) ? null : items as T[];
}

export function parsePaymentOption(value: unknown): PaymentOption | null {
  if (!isRecord(value) || !isRecord(value.breakdown)) return null;

  const capital = parseMoney(value.breakdown.capital);
  const interest = parseMoney(value.breakdown.interest);
  const lateFee = parseMoney(value.breakdown.lateFee);
  const reconnection = parseMoney(value.breakdown.reconnection);
  const total = parseMoney(value.total);
  const installments = parseList(
    value.installments,
    (item) => (isPositiveInteger(item) ? item : null),
  );

  if (
    !isPositiveInteger(value.installmentCount)
    || installments === null
    || installments.length !== value.installmentCount
    || !isCalendarDateString(value.lastDueDate)
    || typeof value.interestFree !== "boolean"
    || !capital
    || !interest
    || !lateFee
    || !reconnection
    || !total
  ) {
    return null;
  }

  return {
    installmentCount: value.installmentCount,
    installments,
    lastDueDate: value.lastDueDate,
    breakdown: { capital, interest, lateFee, reconnection },
    total,
    interestFree: value.interestFree,
  };
}

export function parseSourceBank(value: unknown): SourceBank | null {
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

// --- Respuestas del BFF (el navegador vuelve a validar lo que recibe) ---

function parsePendingInstallment(value: unknown): PendingInstallment | null {
  if (!isRecord(value)) return null;
  const amount = parseMoney(value.amount);
  const status = parseInstallmentStatus(value.status);
  if (
    !isUuid(value.installmentId)
    || !isPositiveInteger(value.number)
    || !isCalendarDateString(value.dueDate)
    || typeof value.isNext !== "boolean"
    || !amount
    || status === null
    || status === "PAGADA"
  ) {
    return null;
  }
  return {
    installmentId: value.installmentId,
    number: value.number,
    dueDate: value.dueDate,
    amount,
    status,
    isNext: value.isNext,
  };
}

function parseInstallmentsConsumption(value: unknown): InstallmentsConsumption | null {
  if (!isRecord(value)) return null;
  const amount = parseNullable(value.amount, parseMoney);
  const status = parseNullable(value.status, parseConsumptionStatus);
  const consumedOn = parseNullable(
    value.consumedOn,
    (item) => (isCalendarDateString(item) ? item : null),
  );
  const totalInstallments = parseNullable(
    value.totalInstallments,
    (item) => (isPositiveInteger(item) ? item : null),
  );
  const paidInstallments = parseNullable(
    value.paidInstallments,
    (item) => (isNonNegativeInteger(item) ? item : null),
  );
  const pendingInstallments = parseList(value.pendingInstallments, parsePendingInstallment);

  if (
    !isUuid(value.consumptionId)
    || !isNonEmptyString(value.label)
    || !amount.ok
    || !status.ok
    || !consumedOn.ok
    || !totalInstallments.ok
    || !paidInstallments.ok
    || pendingInstallments === null
    || pendingInstallments.length === 0
  ) {
    return null;
  }

  return {
    consumptionId: value.consumptionId,
    label: value.label,
    icon: parseIcon(value.icon),
    consumedOn: consumedOn.value,
    amount: amount.value,
    totalInstallments: totalInstallments.value,
    paidInstallments: paidInstallments.value,
    status: status.value,
    pendingInstallments,
  };
}

export function parseInstallmentsOverview(value: unknown): InstallmentsOverview | null {
  if (!isRecord(value)) return null;
  const consumptions = parseList(value.consumptions, parseInstallmentsConsumption);
  return consumptions === null ? null : { consumptions };
}

export function parseScheduleInstallment(value: unknown): ScheduleInstallment | null {
  if (!isRecord(value)) return null;
  const amount = parseMoney(value.amount);
  const status = parseInstallmentStatus(value.status);
  const paidOn = parseNullable(
    value.paidOn,
    (item) => (isCalendarDateString(item) ? item : null),
  );
  if (
    !isUuid(value.installmentId)
    || !isPositiveInteger(value.number)
    || !isCalendarDateString(value.dueDate)
    || typeof value.isNext !== "boolean"
    || !amount
    || status === null
    || !paidOn.ok
  ) {
    return null;
  }
  return {
    installmentId: value.installmentId,
    number: value.number,
    dueDate: value.dueDate,
    amount,
    status,
    isNext: value.isNext,
    paidOn: paidOn.value,
  };
}

function parseDebt(value: unknown): ConsumptionDetail["debt"] | null {
  if (!isRecord(value)) return null;
  const nextInstallment = parseNullable(value.nextInstallment, parsePaymentOption);
  const allPending = parseNullable(value.allPending, parsePaymentOption);
  return nextInstallment.ok && allPending.ok
    ? { nextInstallment: nextInstallment.value, allPending: allPending.value }
    : null;
}

export function parseConsumptionDetail(value: unknown): ConsumptionDetail | null {
  if (!isRecord(value) || !isRecord(value.consumption)) return null;
  const consumption = value.consumption;
  const amount = parseMoney(consumption.amount);
  const status = parseConsumptionStatus(consumption.status);
  const everyDays = parseNullable(
    consumption.everyDays,
    (item) => (isPositiveInteger(item) ? item : null),
  );
  const interestFreeDays = parseNullable(
    consumption.interestFreeDays,
    (item) => (isNonNegativeInteger(item) ? item : null),
  );
  const installments = parseList(value.installments, parseScheduleInstallment);
  const debt = parseDebt(value.debt);

  if (
    !isUuid(consumption.consumptionId)
    || !isNonEmptyString(consumption.label)
    || !isCalendarDateString(consumption.consumedOn)
    || !isPositiveInteger(consumption.totalInstallments)
    || !amount
    || status === null
    || !everyDays.ok
    || !interestFreeDays.ok
    || installments === null
    || debt === null
  ) {
    return null;
  }

  return {
    consumption: {
      consumptionId: consumption.consumptionId,
      label: consumption.label,
      icon: parseIcon(consumption.icon),
      status,
      consumedOn: consumption.consumedOn,
      amount,
      totalInstallments: consumption.totalInstallments,
      everyDays: everyDays.value,
      interestFreeDays: interestFreeDays.value,
    },
    installments,
    debt,
  };
}

function parseOptionalText(value: unknown) {
  return parseNullable(value, (item) => (isNonEmptyString(item) ? item.trim() : null));
}

export function parsePaymentData(value: unknown): PaymentData | null {
  if (
    !isRecord(value)
    || !isRecord(value.destination)
    || !isRecord(value.quote)
    || !isRecord(value.quote.rate)
  ) {
    return null;
  }

  const { destination, quote } = value;
  const rate = quote.rate as Record<string, unknown>;
  const beneficiaryName = parseOptionalText(destination.beneficiaryName);
  const account = parseOptionalText(destination.account);
  const accountType = parseOptionalText(destination.accountType);
  const nextInstallment = parseNullable(quote.nextInstallment, parsePaymentOption);
  const allPending = parseNullable(quote.allPending, parsePaymentOption);
  const options = parseList(quote.options, parsePaymentOption);
  const sourceBanks = parseList(value.sourceBanks, parseSourceBank);

  if (
    !isNonEmptyString(destination.bank)
    || typeof destination.bankCode !== "string"
    || !bankCodePattern.test(destination.bankCode)
    || !isNonEmptyString(destination.taxId)
    || !isNonEmptyString(destination.phone)
    || !beneficiaryName.ok
    || !account.ok
    || !accountType.ok
    || !isCalendarDateString(quote.paymentDate)
    || !isNonEmptyString(rate.bolivaresPerUsd)
    || !isCalendarDateString(rate.effectiveDate)
    || typeof quote.hasDebt !== "boolean"
    || !nextInstallment.ok
    || !allPending.ok
    || options === null
    || sourceBanks === null
    || sourceBanks.length === 0
  ) {
    return null;
  }

  return {
    destination: {
      bank: destination.bank.trim(),
      bankCode: destination.bankCode,
      taxId: destination.taxId.trim(),
      phone: destination.phone.trim(),
      beneficiaryName: beneficiaryName.value,
      account: account.value,
      accountType: accountType.value,
    },
    quote: {
      paymentDate: quote.paymentDate,
      rate: { bolivaresPerUsd: rate.bolivaresPerUsd, effectiveDate: rate.effectiveDate },
      hasDebt: quote.hasDebt,
      nextInstallment: nextInstallment.value,
      allPending: allPending.value,
      options,
    },
    sourceBanks,
  };
}

export function parseInstallmentReportResult(value: unknown): InstallmentReportResult | null {
  if (!isRecord(value)) return null;
  const amount = parseMoney(value.amount);
  const reportedAmountBs = normalizeAmount(value.reportedAmountBs);
  if (
    !isNonEmptyString(value.reportId)
    || !amount
    || reportedAmountBs === null
    || !isCalendarDateString(value.paymentDate)
    || typeof value.receiptAttached !== "boolean"
  ) {
    return null;
  }
  return {
    reportId: value.reportId,
    amount,
    reportedAmountBs,
    paymentDate: value.paymentDate,
    receiptAttached: value.receiptAttached,
  };
}

// --- Errores del BFF ---

export type InstallmentsBffError =
  | "amount_mismatch"
  | "consumption_not_found"
  | "invalid_payment_support"
  | "invalid_request"
  | "no_debt"
  | "payment_data_unconfigured"
  | "payment_support_too_large"
  | "rate_unavailable"
  | "report_pending";

const bffErrors = new Set<InstallmentsBffError>([
  "amount_mismatch",
  "consumption_not_found",
  "invalid_payment_support",
  "invalid_request",
  "no_debt",
  "payment_data_unconfigured",
  "payment_support_too_large",
  "rate_unavailable",
  "report_pending",
]);

export type ParsedInstallmentsBffError = Readonly<{
  error: InstallmentsBffError;
  expectedAmountBs: string | null;
  reportedAmountBs: string | null;
}>;

export function parseInstallmentsBffError(value: unknown): ParsedInstallmentsBffError | null {
  if (!isRecord(value) || !bffErrors.has(value.error as InstallmentsBffError)) return null;
  return {
    error: value.error as InstallmentsBffError,
    expectedAmountBs: normalizeAmount(value.expectedAmountBs),
    reportedAmountBs: normalizeAmount(value.reportedAmountBs),
  };
}
