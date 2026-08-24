import type { PaymentReportResult } from "../types";

export type CorePaymentReportConflict =
  | "payment_report_pending"
  | "payment_report_conflict";

export type ParsedCorePaymentReportResponse =
  | Readonly<{ ok: true; value: PaymentReportResult }>
  | Readonly<{
      ok: false;
      type: "conflict";
      conflict: CorePaymentReportConflict;
    }>
  | Readonly<{ ok: false; type: "http"; status: number }>
  | Readonly<{ ok: false; type: "protocol" }>;

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

export function normalizeCoreMoney(value: unknown): string | null {
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

function parsePaymentReportResult(value: unknown): PaymentReportResult | null {
  if (!isRecord(value) || !isRecord(value.monto)) return null;

  const amountBs = normalizeCoreMoney(value.monto.bs);
  return amountBs === null ? null : { amountBs };
}

async function readJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

function classifyCorePaymentReportConflict(
  value: unknown,
): CorePaymentReportConflict {
  if (
    !isRecord(value)
    || (
      value.status !== undefined
      && value.status !== 409
    )
    || value.codigo !== "REPORTE_PENDIENTE"
  ) {
    return "payment_report_conflict";
  }

  return "payment_report_pending";
}

export async function parseCorePaymentReportResponse(
  response: Response,
): Promise<ParsedCorePaymentReportResponse> {
  if (response.status === 409) {
    return {
      ok: false,
      type: "conflict",
      conflict: classifyCorePaymentReportConflict(await readJson(response)),
    };
  }

  if (response.status !== 200 && response.status !== 201) {
    return { ok: false, type: "http", status: response.status };
  }

  const result = parsePaymentReportResult(await readJson(response));
  return result === null
    ? { ok: false, type: "protocol" }
    : { ok: true, value: result };
}
