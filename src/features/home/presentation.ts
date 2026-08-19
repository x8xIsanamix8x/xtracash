import type {
  ActivityKind,
  FinancingSummary,
  HomeAccountMovement,
  HomeAccountProduct,
  HomeAccountPayments,
  RecentActivityItem,
} from "./types";

const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const movementPresentation: Record<
  HomeAccountMovement["type"],
  Readonly<{ kind: ActivityKind; title: string }>
> = {
  CREDITO_APROBADO: {
    kind: "approval",
    title: "Crédito aprobado",
  },
  CREDITO_RECHAZADO: {
    kind: "rejection",
    title: "Crédito rechazado",
  },
  CREDITO_PROCESO: {
    kind: "processing",
    title: "Crédito en proceso",
  },
};

export function formatBolivars(value: string): string {
  const [integerPart, fractionPart = ""] = value.split(".");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");
  const groupedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const normalizedFraction = fractionPart.padEnd(2, "0");

  return `Bs. ${groupedInteger},${normalizedFraction}`;
}

export function formatCutoffDate(value: string | null): string {
  if (value === null) return "Empieza a utilizar tu crédito";

  const [, month, day] = value.split("-").map(Number);
  return `${day} de ${monthNames[month - 1]}`;
}

export function formatMovementDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function createFinancingSummary(
  product: HomeAccountProduct,
  payments: HomeAccountPayments,
): FinancingSummary {
  return {
    status: payments.delinquencyStage,
    assignedLimit: formatBolivars(product.limitBs),
    available: formatBolivars(product.availableBs),
    currentDebt: payments.currentDebtBs === null
      ? formatBolivars("0")
      : formatBolivars(payments.currentDebtBs),
    minimumPayment: payments.minimumPaymentBs === null
      ? formatBolivars("0")
      : formatBolivars(payments.minimumPaymentBs),
    nextCutDate: formatCutoffDate(payments.nextCutoffDate),
    hasPendingPayment: payments.hasPendingPayment,
  };
}

export function createRecentActivity(
  movements: readonly HomeAccountMovement[],
): readonly RecentActivityItem[] {
  return movements
    .map((movement, originalIndex) => ({ movement, originalIndex }))
    .sort((left, right) => (
      right.movement.date.localeCompare(left.movement.date)
      || left.originalIndex - right.originalIndex
    ))
    .slice(0, 5)
    .map(({ movement, originalIndex }) => {
      const presentation = movementPresentation[movement.type];

      return {
        id: `${movement.type}-${movement.date}-${originalIndex}`,
        kind: presentation.kind,
        title: presentation.title,
        amount: formatBolivars(movement.amountBs),
        date: formatMovementDate(movement.date),
      };
    });
}
