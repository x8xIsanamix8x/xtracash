import type { MobilePaymentAccessStatus } from "../types";

export type ParsedCoreMobilePaymentBalance = Readonly<{
  availableBs: string;
}>;

export type ParsedCoreMobilePaymentSummary = Readonly<{
  accessStatus: MobilePaymentAccessStatus;
}>;

const coreMoneyPattern = /^(\d+)(?:\.(\d{1,4}))?$/;
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

function normalizeCoreMoney(value: unknown): string | null {
  if (typeof value !== "string") return null;

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

export function parseCoreMobilePaymentBalance(
  value: unknown,
): ParsedCoreMobilePaymentBalance | null {
  if (!isRecord(value) || !isRecord(value.available)) return null;

  const availableBs = normalizeCoreMoney(value.available.bs);
  return availableBs === null ? null : { availableBs };
}

export function parseCoreMobilePaymentSummary(
  value: unknown,
): ParsedCoreMobilePaymentSummary | null {
  if (!isRecord(value) || !isRecord(value.balance)) return null;

  switch (value.balance.status) {
    case "AL_DIA":
      return { accessStatus: "active" };
    case "SUSPENDIDO":
      return { accessStatus: "suspended" };
    case "BLOQUEADO":
      return { accessStatus: "blocked" };
    default:
      return null;
  }
}
