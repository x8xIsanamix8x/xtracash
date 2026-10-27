import { formatBolivars, getFirstName } from "./presentation";
import type {
  HomeConsumptionStatus,
  HomeDashboardViewModel,
  NewBusinessHomeData,
} from "./newBusinessTypes";

const statusPresentation = {
  UP_TO_DATE: { label: "Al día", tone: "positive" },
  PAYMENT_DUE: { label: "Cuota vencida", tone: "attention" },
  OVERDUE: { label: "En mora", tone: "danger" },
  PAID: { label: "Pagado", tone: "positive" },
} as const satisfies Record<
  HomeConsumptionStatus,
  Readonly<{ label: string; tone: "positive" | "attention" | "danger" }>
>;

function hasPositiveAmount(value: string): boolean {
  const [integer, fraction = ""] = value.split(".");
  return BigInt(`${integer}${fraction.padEnd(2, "0")}`) > BigInt(0);
}

export function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const formatter = new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    timeZone: "America/Caracas",
  });
  return formatter.format(new Date(Date.UTC(year, month - 1, day, 16)));
}

export function createNewBusinessHomeViewModel(
  data: NewBusinessHomeData,
): HomeDashboardViewModel {
  const isSuspended = data.balance.status === "SUSPENDED";
  const isBlocked = data.balance.status === "BLOCKED";
  const hasBalanceDue = data.balance.status === "PAYMENT_DUE";
  const overdueConsumption = data.consumptions.some((item) => item.status === "OVERDUE");
  const dueConsumption = data.consumptions.some((item) => item.status === "PAYMENT_DUE");
  const hasDebt = hasPositiveAmount(data.debt.total.bs);
  const restricted = isSuspended || isBlocked;
  const needsInstallmentAction = restricted || hasBalanceDue || overdueConsumption || dueConsumption;

  let status: HomeDashboardViewModel["status"];
  if (isSuspended) status = { label: "Línea suspendida", tone: "danger" };
  else if (isBlocked) status = { label: "Disponible bloqueado", tone: "attention" };
  else if (overdueConsumption) status = { label: "En mora", tone: "danger" };
  else if (hasBalanceDue || dueConsumption) status = { label: "Cuota pendiente", tone: "attention" };
  else status = { label: data.consumptions.length > 0 ? "Estás al día" : "Crédito activo", tone: "positive" };

  let notice: HomeDashboardViewModel["notice"] = null;
  if (isSuspended) {
    notice = {
      message: "Tu línea está suspendida por la empresa. Consulta tus cuotas o contacta a tu empresa para conocer los pasos para reactivarla.",
      tone: "danger",
      suspended: true,
    };
  } else if (isBlocked) {
    notice = {
      message: "Tienes cuotas vencidas y tu disponible está bloqueado. Revisa tus cuotas para regularizar el saldo.",
      tone: "attention",
      suspended: false,
    };
  } else if (overdueConsumption) {
    notice = {
      message: "Tienes cuotas vencidas con mora. Revisa el detalle de cada consumo en Mis cuotas.",
      tone: "danger",
      suspended: false,
    };
  } else if (hasBalanceDue || dueConsumption) {
    notice = {
      message: "Tienes una cuota vencida. Revisa Mis cuotas para consultar el monto actualizado y las opciones de pago.",
      tone: "attention",
      suspended: false,
    };
  } else if (hasDebt && data.consumptions.length === 0) {
    notice = {
      message: "Tienes un saldo pendiente. Consulta el detalle actualizado en Mis cuotas.",
      tone: "attention",
      suspended: false,
    };
  }

  return {
    firstName: getFirstName(data.fullName),
    status,
    balance: {
      available: formatBolivars(data.balance.available.bs),
      totalCredit: formatBolivars(data.balance.totalCredit.bs),
      primaryAction: needsInstallmentAction ? "reportInstallment" : "useAvailable",
      primaryActionLabel: isSuspended
        ? "Ver mis cuotas"
        : needsInstallmentAction
          ? "Pagar cuotas"
          : "Usar mi disponible",
      isRestricted: restricted,
    },
    notice,
    consumptions: data.consumptions.map((consumption) => {
      const presentation = statusPresentation[consumption.status];
      const progress = consumption.installments > 0
        ? Math.min(
          100,
          Math.max(
            0,
            Math.round((consumption.paidInstallments / consumption.installments) * 100),
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
    // El resumen contiene hasta cinco consumos, no el calendario global de cuotas.
    // No se suman sus próximas cuotas como si fueran el total de deuda o vencimientos.
    debt: hasDebt
      ? { total: formatBolivars(data.debt.total.bs), nextPaymentDate: null, nextPaymentAmount: null }
      : null,
    showReportInstallmentAction: needsInstallmentAction || hasDebt,
  };
}
