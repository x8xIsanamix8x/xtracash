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

function readNullableString(value: unknown): string | null {
  return value === undefined || value === null || typeof value === "string"
    ? value?.trim() ?? null
    : null;
}

function parseLegacyMovement(value: unknown): CreditMovement | null {
  if (!isRecord(value)) return null;
  const amountBs = readMoney(value.monto);
  const counterparty = value.contraparte === null
    ? "Crédito"
    : isNonEmptyString(value.contraparte)
    ? value.contraparte.trim()
    : null;
  if (
    !isUuid(value.id)
    || !isCreditMovementType(value.tipo)
    || !isCreditMovementStatus(value.estado)
    || !isNonEmptyString(value.estadoDetalle)
    || amountBs === null
    || !isDateTime(value.fecha)
    || counterparty === null
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
    counterparty,
    rejectionReason: value.motivoRechazo === null
      ? null
      : value.motivoRechazo.trim(),
  };
}

/**
 * Maps the payment-report item currently published by Core's
 * /estado-cuenta contract to the stable BFF contract consumed by the UI.
 *
 * Core's documented response does not include `tipo`, `contraparte`, or
 * `estadoDetalle`. These items are payment reports by shape, so their type and
 * detail are made explicit here instead of requiring undocumented fields.
 */
function parseCorePaymentReportMovement(value: unknown): CreditMovement | null {
  if (!isRecord(value)) return null;

  const amountBs = readMoney(value.monto);
  const rejectionReason = readNullableString(value.motivoRechazo);
  const hasValidRejectionReason = value.motivoRechazo === undefined
    || value.motivoRechazo === null
    || typeof value.motivoRechazo === "string";
  const occurredAt = isDateTime(value.reportadoEn)
    ? value.reportadoEn
    : isCalendarDate(value.fechaPago)
    ? `${value.fechaPago}T12:00:00-04:00`
    : null;

  if (
    !isUuid(value.id)
    || amountBs === null
    || !isCreditMovementStatus(value.estado)
    || !isNonEmptyString(value.bancoEmisor)
    || occurredAt === null
    || !hasValidRejectionReason
  ) {
    return null;
  }

  return {
    id: value.id,
    type: "REPORTE_PAGO",
    status: value.estado,
    statusDetail: `Reporte de pago ${value.estado.toLocaleLowerCase("es-VE")}`,
    amountBs,
    occurredAt,
    counterparty: value.bancoEmisor.trim(),
    rejectionReason,
  };
}

function parseMovement(value: unknown): CreditMovement | null {
  return parseLegacyMovement(value) ?? parseCorePaymentReportMovement(value);
}

function normalizeModernStatus(value: unknown): CreditMovement["status"] | null {
  if (value === "PENDIENTE" || value === "EN_PROCESO") return "PENDIENTE";
  if (value === "APROBADO" || value === "CONFIRMADA") return "APROBADO";
  if (value === "RECHAZADO" || value === "RECHAZADA" || value === "FALLIDA") return "RECHAZADO";
  return null;
}

function parseModernMovement(value: unknown): CreditMovement | null {
  if (!isRecord(value) || !isNonEmptyString(value.id)) return null;
  const type = value.type === "CONSUMO"
    ? "CONSUMO"
    : value.type === "REPORTE_PAGO" || value.type === "REPORTE"
      ? "REPORTE_PAGO"
    : null;
  const status = normalizeModernStatus(value.status);
  const amountBs = readMoney(value.amount);
  if (!type || !status || amountBs === null || !isDateTime(value.date)) return null;
  const label = isNonEmptyString(value.label) ? value.label.trim() : "Movimiento";
  const icon = isNonEmptyString(value.icon) ? value.icon.trim() : "services";
  return {
    id: value.id,
    type,
    status,
    statusDetail: typeof value.debtStatus === "string" ? value.debtStatus : String(value.status),
    amountBs,
    occurredAt: value.date,
    counterparty: typeof value.beneficiaryName === "string"
      ? value.beneficiaryName
      : label,
    rejectionReason: typeof value.rejectionReason === "string" ? value.rejectionReason : null,
    label,
    icon,
    beneficiaryName: typeof value.beneficiaryName === "string" ? value.beneficiaryName : null,
    bankReference: typeof value.bankReference === "string" ? value.bankReference : null,
    paymentDate: typeof value.paymentDate === "string" ? value.paymentDate : null,
  };
}

function parseModernCreditMovements(value: Record<string, unknown>): CreditMovementsPage | null {
  if (!Array.isArray(value.items)
    || !Number.isSafeInteger(value.page)
    || !Number.isSafeInteger(value.size)
    || !Number.isSafeInteger(value.total)
    || (value.page as number) < 0
    || (value.size as number) <= 0
    || (value.total as number) < 0) return null;
  const movements = value.items.map(parseModernMovement);
  if (movements.some((movement) => movement === null)) return null;
  return {
    availableBs: null,
    currentDebtBs: null,
    minimumPaymentBs: null,
    nextCutoffDate: null,
    financialStatus: null,
    movements: movements as readonly CreditMovement[],
    page: value.page as number,
    size: value.size as number,
    total: value.total as number,
  };
}

export function parseCoreCreditMovements(
  value: unknown,
): CreditMovementsPage | null {
  if (isRecord(value) && Array.isArray(value.items)) {
    return parseModernCreditMovements(value);
  }
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
