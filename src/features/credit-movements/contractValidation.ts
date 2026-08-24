import type {
  CreditMovement,
  CreditMovementStatus,
  CreditMovementType,
  CreditMovementsPage,
} from "./types";

const canonicalAmountPattern = /^(0|[1-9]\d*)\.\d{2}$/;
const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const movementTypes = new Set<CreditMovementType>([
  "CREDITO",
  "REPORTE_PAGO",
]);
const movementStatuses = new Set<CreditMovementStatus>([
  "PENDIENTE",
  "APROBADO",
  "RECHAZADO",
]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function isCanonicalAmount(value: unknown): value is string {
  return typeof value === "string" && canonicalAmountPattern.test(value);
}

export function isCalendarDate(value: unknown): value is string {
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

export function isDateTime(value: unknown): value is string {
  return typeof value === "string"
    && dateTimePattern.test(value)
    && Number.isFinite(Date.parse(value));
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function isCreditMovementType(
  value: unknown,
): value is CreditMovementType {
  return typeof value === "string"
    && movementTypes.has(value as CreditMovementType);
}

export function isCreditMovementStatus(
  value: unknown,
): value is CreditMovementStatus {
  return typeof value === "string"
    && movementStatuses.has(value as CreditMovementStatus);
}

function parseMovement(value: unknown): CreditMovement | null {
  if (
    !isRecord(value)
    || !isUuid(value.id)
    || !isCreditMovementType(value.type)
    || !isCreditMovementStatus(value.status)
    || !isNonEmptyString(value.statusDetail)
    || !isCanonicalAmount(value.amountBs)
    || !isDateTime(value.occurredAt)
    || !isNonEmptyString(value.counterparty)
    || (
      value.rejectionReason !== null
      && typeof value.rejectionReason !== "string"
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type,
    status: value.status,
    statusDetail: value.statusDetail.trim(),
    amountBs: value.amountBs,
    occurredAt: value.occurredAt,
    counterparty: value.counterparty.trim(),
    rejectionReason: value.rejectionReason === null
      ? null
      : value.rejectionReason.trim(),
  };
}

export function parseCreditMovementsPage(
  value: unknown,
): CreditMovementsPage | null {
  if (
    !isRecord(value)
    || !isCanonicalAmount(value.availableBs)
    || !isCanonicalAmount(value.currentDebtBs)
    || !isCanonicalAmount(value.minimumPaymentBs)
    || (
      value.nextCutoffDate !== null
      && !isCalendarDate(value.nextCutoffDate)
    )
    || !isNonEmptyString(value.financialStatus)
    || !Array.isArray(value.movements)
    || !Number.isSafeInteger(value.page)
    || (value.page as number) < 0
    || !Number.isSafeInteger(value.size)
    || (value.size as number) <= 0
    || !Number.isSafeInteger(value.total)
    || (value.total as number) < 0
  ) {
    return null;
  }

  const movements = value.movements.map(parseMovement);
  if (movements.some((movement) => movement === null)) return null;

  return {
    availableBs: value.availableBs,
    currentDebtBs: value.currentDebtBs,
    minimumPaymentBs: value.minimumPaymentBs,
    nextCutoffDate: value.nextCutoffDate,
    financialStatus: value.financialStatus.trim(),
    movements: movements as readonly CreditMovement[],
    page: value.page as number,
    size: value.size as number,
    total: value.total as number,
  };
}
