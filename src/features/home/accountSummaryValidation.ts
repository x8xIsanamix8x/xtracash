import type {
  CoreMovementType,
  HomeAccountMovement,
  HomeAccountPayments,
  HomeAccountProduct,
  HomeAccountSummary,
} from "./types";

const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const coreAmountPattern = /^(\d+)(?:\.(\d{1,4}))?$/;
const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const nextDecimalDigit: Readonly<Record<string, string>> = {
  "0": "1",
  "1": "2",
  "2": "3",
  "3": "4",
  "4": "5",
  "5": "6",
  "6": "7",
  "7": "8",
  "8": "9",
};

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

type AmountReader = (value: unknown) => string | null;

function incrementDecimalDigits(value: string): string {
  const digits = value.split("");

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    if (digits[index] !== "9") {
      digits[index] = nextDecimalDigit[digits[index]];
      return digits.join("");
    }

    digits[index] = "0";
  }

  return `1${digits.join("")}`;
}

function readCoreAmount(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const match = coreAmountPattern.exec(value);
  if (!match) return null;

  const whole = match[1].replace(/^0+(?=\d)/, "");
  const fraction = match[2] ?? "";
  const cents = fraction.padEnd(2, "0").slice(0, 2);

  if (fraction.length <= 2 || fraction[2] < "5") {
    return `${whole}.${cents}`;
  }

  const roundedMinorUnits = incrementDecimalDigits(`${whole}${cents}`)
    .padStart(3, "0");

  return `${roundedMinorUnits.slice(0, -2)}.${roundedMinorUnits.slice(-2)}`;
}

function readDtoAmount(value: unknown): string | null {
  return isAmount(value) ? value : null;
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

function readAmountObject(
  value: unknown,
  readAmount: AmountReader,
): string | null {
  if (!isRecord(value)) return null;
  return readAmount(value.bs);
}

function parseProduct(
  value: unknown,
  readAmount: AmountReader,
): HomeAccountProduct | null {
  if (!isRecord(value)) return null;

  const limitBs = readAmountObject(value.limit, readAmount);
  const availableBs = readAmountObject(value.available, readAmount);
  if (limitBs === null || availableBs === null) return null;

  return { limitBs, availableBs };
}

function parsePayments(
  value: unknown,
  readAmount: AmountReader,
): HomeAccountPayments | null {
  if (!isRecord(value)) return null;
  if (typeof value.hasPendingPayment !== "boolean") return null;
  if (
    value.nextCutoffDate !== null
    && !isCalendarDate(value.nextCutoffDate)
  ) {
    return null;
  }
  const currentDebtBs = value.currentDebt === null
    ? null
    : readAmountObject(value.currentDebt, readAmount);
  const minimumPaymentBs = value.minimumPayment === null
    ? null
    : readAmountObject(value.minimumPayment, readAmount);
  if (value.currentDebt !== null && currentDebtBs === null) return null;
  if (value.minimumPayment !== null && minimumPaymentBs === null) return null;
  if (
    typeof value.delinquencyStage !== "string"
    || !delinquencyStages.has(value.delinquencyStage)
  ) {
    return null;
  }

  return {
    hasPendingPayment: value.hasPendingPayment,
    nextCutoffDate: value.nextCutoffDate,
    currentDebtBs,
    minimumPaymentBs,
    delinquencyStage: value.delinquencyStage as HomeAccountPayments["delinquencyStage"],
  };
}

function parseMovement(
  value: unknown,
  readAmount: AmountReader,
  omitUnsupportedType: boolean,
): HomeAccountMovement | "unsupported" | null {
  if (!isRecord(value)) return null;
  const amountBs = readAmount(value.amountBs);
  if (
    typeof value.type !== "string"
    || !value.type.trim()
    || !isCalendarDate(value.date)
    || amountBs === null
  ) {
    return null;
  }

  if (!movementTypes.has(value.type)) {
    return omitUnsupportedType ? "unsupported" : null;
  }

  return {
    type: value.type as CoreMovementType,
    date: value.date,
    amountBs,
  };
}

function parseMovements(
  value: unknown,
  readAmount: AmountReader,
  omitUnsupportedTypes = false,
): readonly HomeAccountMovement[] | null {
  if (!Array.isArray(value)) return null;

  const movements: HomeAccountMovement[] = [];
  for (const movement of value) {
    const parsedMovement = parseMovement(
      movement,
      readAmount,
      omitUnsupportedTypes,
    );
    if (parsedMovement === null) return null;
    if (parsedMovement !== "unsupported") movements.push(parsedMovement);
  }

  return movements;
}

export function parseCoreAccountSummary(value: unknown): HomeAccountSummary | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  if (typeof value.accountStatus !== "string" || !value.accountStatus.trim()) {
    return null;
  }
  if (!Array.isArray(value.products)) return null;

  const product = value.products.length > 0
    ? parseProduct(value.products[0], readCoreAmount)
    : null;
  if (value.products.length > 0 && product === null) return null;

  const payments = parsePayments(value.payments, readCoreAmount);
  const movements = parseMovements(value.movements, readCoreAmount, true);
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
  }, readDtoAmount);
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
  }, readDtoAmount);
  const movements = parseMovements(value.movements, readDtoAmount);
  if (payments === null || movements === null) return null;

  return {
    name: value.name.trim(),
    accountStatus: value.accountStatus.trim(),
    product,
    payments,
    movements,
  };
}
