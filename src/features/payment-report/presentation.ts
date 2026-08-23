import { impulsaPaymentDestination } from "./data/paymentReport";
import type {
  PaymentAmountOption,
  PaymentDetail,
} from "./types";

const amountPattern = /^(\d+)(?:\.(\d{1,2}))?$/;

export function normalizePaymentAmount(value: string | null): string | null {
  if (value === null) return null;

  const match = amountPattern.exec(value);
  if (!match) return null;

  const whole = match[1].replace(/^0+(?=\d)/, "");
  const fraction = (match[2] ?? "").padEnd(2, "0");
  if (!/[1-9]/.test(`${whole}${fraction}`)) return null;

  return `${whole}.${fraction}`;
}

export function formatPaymentAmount(amountBs: string): string {
  const [whole, fraction] = amountBs.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Bs. ${groupedWhole},${fraction}`;
}

export function createPaymentAmountOptions(
  currentDebtBs: string | null,
  minimumPaymentBs: string | null,
): readonly PaymentAmountOption[] {
  return [
    {
      kind: "full",
      label: "Pago completo",
      amountBs: normalizePaymentAmount(currentDebtBs),
    },
    {
      kind: "minimum",
      label: "Pago mínimo",
      amountBs: normalizePaymentAmount(minimumPaymentBs),
    },
  ];
}

export function createPaymentDetails(amountBs: string): readonly PaymentDetail[] {
  return [
    {
      key: "bank",
      label: "Banco destino",
      displayValue: impulsaPaymentDestination.bank.displayValue,
      copyValue: impulsaPaymentDestination.bank.code,
    },
    {
      key: "rif",
      label: "RIF",
      displayValue: impulsaPaymentDestination.rif.displayValue,
      copyValue: impulsaPaymentDestination.rif.copyValue,
    },
    {
      key: "phone",
      label: "Teléfono",
      displayValue: impulsaPaymentDestination.phone.displayValue,
      copyValue: impulsaPaymentDestination.phone.copyValue,
    },
    {
      key: "amount",
      label: "Monto a pagar",
      displayValue: formatPaymentAmount(amountBs),
      copyValue: amountBs,
    },
  ];
}

export function createCopyAllText(details: readonly PaymentDetail[]): string {
  return details
    .map((detail) => `${detail.label}: ${detail.copyValue}`)
    .join("\n");
}
