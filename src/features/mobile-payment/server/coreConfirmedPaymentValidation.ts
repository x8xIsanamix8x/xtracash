import type { ConfirmedPayment } from "../types";

const coreMoneyPattern = /^(\d+)(?:\.(\d{1,4}))?$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

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

function normalizeCoreMoney(value: string): string | null {
  const match = coreMoneyPattern.exec(value);
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

export function readCoreMoney(value: unknown): string | null {
  if (!isRecord(value) || typeof value.bs !== "string") return null;
  return normalizeCoreMoney(value.bs);
}

export function parseCoreConfirmedPayment(
  value: unknown,
): ConfirmedPayment | null {
  if (!isRecord(value)) return null;

  const amountBs = readCoreMoney(value.monto);
  const netAmountBs = readCoreMoney(value.neto);
  const bankReference = value.referenciaBancaria ?? null;
  const resolvedAt = value.resueltaEn ?? null;
  const message = value.mensaje ?? null;

  if (
    !isUuid(value.operacionId)
    || !isNonEmptyString(value.estado)
    || amountBs === null
    || netAmountBs === null
    || (bankReference !== null && !isNonEmptyString(bankReference))
    || (
      resolvedAt !== null
      && (!isNonEmptyString(resolvedAt) || Number.isNaN(Date.parse(resolvedAt)))
    )
    || (message !== null && typeof message !== "string")
  ) {
    return null;
  }

  return {
    operationId: value.operacionId,
    status: value.estado.trim(),
    bankReference: bankReference === null ? null : bankReference.trim(),
    amountBs,
    totalBs: netAmountBs,
    resolvedAt,
    message: message === null ? null : message.trim(),
  };
}
