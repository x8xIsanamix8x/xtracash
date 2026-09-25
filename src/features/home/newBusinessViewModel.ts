import { formatBolivars, getFirstName } from "./presentation";
import type {
  HomeConsumptionStatus,
  HomeDashboardViewModel,
  NewBusinessHomeData,
} from "./newBusinessTypes";

const statusPresentation = {
  UP_TO_DATE: { label: "Al día", tone: "positive" },
  PAYMENT_DUE: { label: "Cuota pendiente", tone: "attention" },
  OVERDUE: { label: "En mora", tone: "attention" },
} as const satisfies Record<
  HomeConsumptionStatus,
  Readonly<{ label: string; tone: "positive" | "attention" }>
>;

export function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const formatter = new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    timeZone: "America/Caracas",
  });
  return formatter.format(new Date(Date.UTC(year, month - 1, day, 16)));
}

/** Suma montos "34372.09" al céntimo, sin errores de coma flotante. */
function sumBolivars(amounts: readonly string[]): string {
  const cents = amounts.reduce((total, amount) => {
    const [integer, fraction = ""] = amount.split(".");
    return total + BigInt(`${integer}${fraction.padEnd(2, "0").slice(0, 2)}`);
  }, BigInt(0));
  const digits = cents.toString().padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function createNewBusinessHomeViewModel(
  data: NewBusinessHomeData,
): HomeDashboardViewModel {
  const isSuspended = data.balance.status === "SUSPENDED";
  const hasPaymentDue = data.balance.status === "PAYMENT_DUE";
  const upcoming = data.consumptions.filter((consumption) => (
    consumption.nextPaymentDate !== null
    && consumption.nextPaymentAmount !== null
  ));
  const nextPaymentDate = upcoming
    .map((consumption) => consumption.nextPaymentDate!)
    .sort()[0] ?? null;
  // Todo lo que vence ese día, de todos los consumos (no solo el primero).
  const nextPaymentAmount = nextPaymentDate
    ? sumBolivars(upcoming
      .filter((consumption) => consumption.nextPaymentDate === nextPaymentDate)
      .map((consumption) => consumption.nextPaymentAmount!.bs))
    : null;

  return {
    firstName: getFirstName(data.fullName),
    status: isSuspended
      ? { label: "Disponible suspendido", tone: "attention" }
      : hasPaymentDue
        ? { label: "Cuota pendiente", tone: "attention" }
        : {
          label: data.consumptions.length > 0 ? "Estás al día" : "Crédito activo",
          tone: "positive",
        },
    balance: {
      available: formatBolivars(data.balance.available.bs),
      totalCredit: formatBolivars(data.balance.totalCredit.bs),
      primaryAction: isSuspended ? "reportInstallment" : "useAvailable",
      primaryActionLabel: isSuspended
        ? "Reactivar"
        : "Usar mi disponible",
    },
    notice: isSuspended
      ? {
        message:
          "Tu disponible está suspendido. Regulariza tus cuotas pendientes para recuperarlo.",
        tone: "attention",
      }
      : hasPaymentDue
        ? {
          message:
            "Tienes una cuota pendiente. Repórtala para mantener tu crédito al día.",
          tone: "attention",
        }
        : null,
    consumptions: data.consumptions.map((consumption) => {
      const presentation = statusPresentation[consumption.status];
      const progress = consumption.installments > 0
        ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (consumption.paidInstallments / consumption.installments) * 100,
            ),
          ),
        )
        : 0;

      return {
        id: consumption.consumptionId,
        icon: consumption.icon,
        label: consumption.label,
        amount: formatBolivars(consumption.amount.bs),
        installmentProgress:
          consumption.paidInstallments === 1
            ? `1 cuota pagada de ${consumption.installments}`
            : `${consumption.paidInstallments} cuotas pagadas de ${consumption.installments}`,
        progress,
        nextPaymentDate: consumption.nextPaymentDate
          ? formatShortDate(consumption.nextPaymentDate)
          : null,
        nextPaymentAmount: consumption.nextPaymentAmount
          ? formatBolivars(consumption.nextPaymentAmount.bs)
          : null,
        statusLabel: presentation.label,
        tone: presentation.tone,
      };
    }),
    debt: {
        total: formatBolivars(data.debt.total.bs),
        nextPaymentDate: nextPaymentDate
          ? formatShortDate(nextPaymentDate)
          : null,
        nextPaymentAmount: nextPaymentAmount
          ? formatBolivars(nextPaymentAmount)
          : null,
      },
    showReportInstallmentAction: data.consumptions.length > 0,
  };
}
