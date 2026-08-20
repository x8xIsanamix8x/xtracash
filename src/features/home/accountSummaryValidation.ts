import type {
  CoreMovementType,
  HomeAccountMovement,
  HomeAccountPayments,
  HomeAccountProduct,
  HomeAccountSummary,
} from "./types";

const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const delinquencyStages = new Set([
  "AL_DIA",
  "CON_MORA",
  "LIMITE_REDUCIDO",
  "BLOQUEADA",
]);

const movementTypes = new Set([
  "CREDITO_APROBADO",
  "CREDITO_RECHAZADO",
  "CREDITO_PROCESO",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAmount(value: unknown): value is string {
  return typeof value === "string" && amountPattern.test(value);
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const match = calendarDatePattern.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

function readAmountObject(value: unknown): string | null {
  if (!isRecord(value) || !isAmount(value.bs)) return null;
  return value.bs;
}

function parseProduct(value: unknown): HomeAccountProduct | null {
  if (!isRecord(value)) return null;

  const limitBs = readAmountObject(value.limit);
  const availableBs = readAmountObject(value.available);
  if (limitBs === null || availableBs === null) return null;

  return { limitBs, availableBs };
}

function parsePayments(value: unknown): HomeAccountPayments | null {
  if (!isRecord(value)) return null;
  if (typeof value.hasPendingPayment !== "boolean") return null;
  if (
    value.nextCutoffDate !== null
    && !isCalendarDate(value.nextCutoffDate)
  ) {
    return null;
  }
  if (
    value.currentDebt !== null
    && readAmountObject(value.currentDebt) === null
  ) {
    return null;
  }
  if (
    value.minimumPayment !== null
    && readAmountObject(value.minimumPayment) === null
  ) {
    return null;
  }
  if (
    typeof value.delinquencyStage !== "string"
    || !delinquencyStages.has(value.delinquencyStage)
  ) {
    return null;
  }

  return {
    hasPendingPayment: value.hasPendingPayment,
    nextCutoffDate: value.nextCutoffDate,
    currentDebtBs: value.currentDebt === null
      ? null
      : readAmountObject(value.currentDebt),
    minimumPaymentBs: value.minimumPayment === null
      ? null
      : readAmountObject(value.minimumPayment),
    delinquencyStage: value.delinquencyStage as HomeAccountPayments["delinquencyStage"],
  };
}

function parseMovement(value: unknown): HomeAccountMovement | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.type !== "string"
    || !movementTypes.has(value.type)
    || !isCalendarDate(value.date)
    || !isAmount(value.amountBs)
  ) {
    return null;
  }

  return {
    type: value.type as CoreMovementType,
    date: value.date,
    amountBs: value.amountBs,
  };
}

function parseMovements(value: unknown): readonly HomeAccountMovement[] | null {
  if (!Array.isArray(value)) return null;

  const movements = value.map(parseMovement);
  if (movements.some((movement) => movement === null)) return null;

  return movements as readonly HomeAccountMovement[];
}

export function parseCoreAccountSummary(value: unknown): HomeAccountSummary | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  if (typeof value.accountStatus !== "string" || !value.accountStatus.trim()) {
    return null;
  }
  if (!Array.isArray(value.products)) return null;

  const product = value.products.length > 0
    ? parseProduct(value.products[0])
    : null;
  if (value.products.length > 0 && product === null) return null;

  const payments = parsePayments(value.payments);
  const movements = parseMovements(value.movements);
  if (payments === null || movements === null) return null;

  return {
    name: value.name.trim(),
    accountStatus: value.accountStatus.trim(),
    product,
    payments,
    movements,
  };
}

export function parseHomeAccountSummary(value: unknown): HomeAccountSummary | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  if (typeof value.accountStatus !== "string" || !value.accountStatus.trim()) {
    return null;
  }

  const product = value.product === null ? null : parseProduct({
    limit: { bs: isRecord(value.product) ? value.product.limitBs : null },
    available: {
      bs: isRecord(value.product) ? value.product.availableBs : null,
    },
  });
  if (value.product !== null && product === null) return null;

  if (!isRecord(value.payments)) return null;
  const payments = parsePayments({
    hasPendingPayment: value.payments.hasPendingPayment,
    nextCutoffDate: value.payments.nextCutoffDate,
    currentDebt: value.payments.currentDebtBs === null
      ? null
      : { bs: value.payments.currentDebtBs },
    minimumPayment: value.payments.minimumPaymentBs === null
      ? null
      : { bs: value.payments.minimumPaymentBs },
    delinquencyStage: value.payments.delinquencyStage,
  });
  const movements = parseMovements(value.movements);
  if (payments === null || movements === null) return null;

  return {
    name: value.name.trim(),
    accountStatus: value.accountStatus.trim(),
    product,
    payments,
    movements,
  };
}
