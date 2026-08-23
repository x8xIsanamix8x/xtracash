import type {
  PaymentAmountOption,
  PaymentDetail,
  PaymentReportDestination,
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

export function createPaymentDetails(
  destination: PaymentReportDestination,
  amountBs: string,
): readonly PaymentDetail[] {
  return [
    {
      key: "bank",
      label: "Banco destino",
      displayValue: `${destination.bankName} — ${destination.bankCode}`,
      copyValue: destination.bankCode,
    },
    {
      key: "rif",
      label: "RIF",
      displayValue: destination.rif,
      copyValue: destination.rif.replace(/[^a-z0-9]/gi, ""),
    },
    {
      key: "phone",
      label: "Teléfono",
      displayValue: destination.receiverPhone,
      copyValue: destination.receiverPhone.replace(/\D/g, ""),
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
