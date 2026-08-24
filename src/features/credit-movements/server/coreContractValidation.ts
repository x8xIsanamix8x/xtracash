import "server-only";

import {
  isCalendarDate,
  isCreditMovementStatus,
  isCreditMovementType,
  isDateTime,
  isNonEmptyString,
  isRecord,
  isUuid,
} from "../contractValidation";
import type {
  CreditMovement,
  CreditMovementsPage,
} from "../types";

const coreAmountPattern = /^(\d+)(?:\.(\d{1,4}))?$/;
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

function normalizeCoreAmount(value: unknown): string | null {
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

function readMoney(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return normalizeCoreAmount(value.bs);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function parseMovement(value: unknown): CreditMovement | null {
  if (!isRecord(value)) return null;
  const amountBs = readMoney(value.monto);
  if (
    !isUuid(value.id)
    || !isCreditMovementType(value.tipo)
    || !isCreditMovementStatus(value.estado)
    || !isNonEmptyString(value.estadoDetalle)
    || amountBs === null
    || !isDateTime(value.fecha)
    || !isNonEmptyString(value.contraparte)
    || !isNullableString(value.codigo)
    || !isNullableString(value.referencia)
    || !isNullableString(value.motivoRechazo)
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.tipo,
    status: value.estado,
    statusDetail: value.estadoDetalle.trim(),
    amountBs,
    occurredAt: value.fecha,
    counterparty: value.contraparte.trim(),
    rejectionReason: value.motivoRechazo === null
      ? null
      : value.motivoRechazo.trim(),
  };
}

export function parseCoreCreditMovements(
  value: unknown,
): CreditMovementsPage | null {
  if (
    !isRecord(value)
    || !isRecord(value.deuda)
    || !isRecord(value.historial)
  ) {
    return null;
  }

  const availableBs = readMoney(value.disponible);
  const currentDebtBs = readMoney(value.deuda.actual);
  const minimumPaymentBs = readMoney(value.deuda.pagoMinimo);
  const nextCutoffDate = value.deuda.proximoCorte;
  const history = value.historial;
  if (
    availableBs === null
    || currentDebtBs === null
    || minimumPaymentBs === null
    || (
      nextCutoffDate !== null
      && !isCalendarDate(nextCutoffDate)
    )
    || !isNonEmptyString(value.deuda.estadoFinanciero)
    || !Array.isArray(history.items)
    || !Number.isSafeInteger(history.page)
    || (history.page as number) < 0
    || !Number.isSafeInteger(history.size)
    || (history.size as number) <= 0
    || !Number.isSafeInteger(history.total)
    || (history.total as number) < 0
    || history.items.length > (history.size as number)
    || history.items.length > (history.total as number)
  ) {
    return null;
  }

  const movements = history.items.map(parseMovement);
  if (movements.some((movement) => movement === null)) return null;

  return {
    availableBs,
    currentDebtBs,
    minimumPaymentBs,
    nextCutoffDate,
    financialStatus: value.deuda.estadoFinanciero.trim(),
    movements: movements as readonly CreditMovement[],
    page: history.page as number,
    size: history.size as number,
    total: history.total as number,
  };
}
