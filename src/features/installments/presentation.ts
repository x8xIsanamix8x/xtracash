import type { ConsumptionCardItem, ConsumptionCardTone } from "../home/components/ConsumptionCard";
import { formatBolivars } from "../home/presentation";
import { formatShortDate } from "../home/newBusinessViewModel";
import type {
  ConsumptionDetail,
  ConsumptionStatus,
  InstallmentStatus,
  InstallmentsConsumption,
  InstallmentsOverview,
  PendingInstallment,
  ScheduleInstallment,
} from "./types";

export type InstallmentsListItem = Readonly<{
  card: ConsumptionCardItem;
  href: string;
  /** Tiene la próxima obligación a vencer (puede haber empate entre consumos). */
  isNext: boolean;
}>;

type StatusPresentation = Readonly<{ label: string; tone: ConsumptionCardTone }>;

/** Como el Figma: "Cuota 01". */
export function formatInstallmentNumber(number: number): string {
  return `Cuota ${String(number).padStart(2, "0")}`;
}

/** El peor estado de sus cuotas manda: mora > vencida > en revisión > al día. */
function getStatusPresentation(consumption: InstallmentsConsumption): StatusPresentation {
  const statuses = new Set(consumption.pendingInstallments.map((item) => item.status));

  if (statuses.has("EN_MORA") || consumption.status === "VENCIDO_CON_MORA") {
    return { label: "En mora", tone: "attention" };
  }
  if (statuses.has("VENCIDA") || consumption.status === "VENCIDO_SIN_MORA") {
    return { label: "Vencida", tone: "attention" };
  }
  if (statuses.has("EN_REVISION")) {
    return { label: "En revisión", tone: "info" };
  }
  return { label: "Al día", tone: "positive" };
}

/** La cuota que el consumo tiene que pagar ahora: la `isNext` o, si no hay, la más vieja. */
export function getCurrentInstallment(
  consumption: InstallmentsConsumption,
): PendingInstallment {
  return consumption.pendingInstallments.find((item) => item.isNext)
    ?? consumption.pendingInstallments[0];
}

function getProgress(consumption: InstallmentsConsumption) {
  const { paidInstallments, totalInstallments, pendingInstallments } = consumption;

  if (paidInstallments === null || totalInstallments === null) {
    const pending = pendingInstallments.length;
    return {
      text: pending === 1 ? "1 cuota pendiente" : `${pending} cuotas pendientes`,
      value: null,
    };
  }

  return {
    text: paidInstallments === 1
      ? `1 cuota pagada de ${totalInstallments}`
      : `${paidInstallments} cuotas pagadas de ${totalInstallments}`,
    value: Math.min(100, Math.max(0, Math.round((paidInstallments / totalInstallments) * 100))),
  };
}

/** Fecha de la próxima obligación: la más cercana entre las cuotas `isNext`. */
function getNextDueDate(consumptions: readonly InstallmentsConsumption[]): string | null {
  const dueDates = consumptions
    .flatMap((consumption) => consumption.pendingInstallments)
    .filter((item) => item.isNext)
    .map((item) => item.dueDate)
    .sort();
  return dueDates[0] ?? null;
}

export function createInstallmentsListItems(
  overview: InstallmentsOverview,
): readonly InstallmentsListItem[] {
  const nextDueDate = getNextDueDate(overview.consumptions);

  return overview.consumptions.map((consumption) => {
    const status = getStatusPresentation(consumption);
    const progress = getProgress(consumption);
    const current = getCurrentInstallment(consumption);

    return {
      href: `/installments/${consumption.consumptionId}`,
      isNext: current.isNext && current.dueDate === nextDueDate,
      card: {
        id: consumption.consumptionId,
        icon: consumption.icon,
        label: consumption.label,
        amount: consumption.amount ? formatBolivars(consumption.amount.bs) : null,
        installmentProgress: progress.text,
        progress: progress.value,
        nextPaymentAmount: formatBolivars(current.amount.bs),
        nextPaymentDate: formatShortDate(current.dueDate),
        nextPaymentLabel: formatInstallmentNumber(current.number),
        statusLabel: status.label,
        tone: status.tone,
      },
    };
  });
}

// --- Detalle del consumo (SPEC-03) ---

const consumptionStatusPresentation = {
  AL_DIA: { label: "Al día", tone: "positive" },
  VENCIDO_SIN_MORA: { label: "Cuota vencida", tone: "attention" },
  VENCIDO_CON_MORA: { label: "En mora", tone: "attention" },
  PAGADO: { label: "Pagado", tone: "positive" },
} as const satisfies Record<ConsumptionStatus, StatusPresentation>;

export type ScheduleStatusKind =
  | "paid"
  | "next"
  | "pending"
  | "overdue"
  | "late"
  | "review";

const scheduleStatusLabels: Readonly<Record<ScheduleStatusKind, string>> = {
  paid: "Pagada",
  next: "Próxima",
  pending: "Pendiente",
  overdue: "Vencida",
  late: "En mora",
  review: "En revisión",
};

const shortMonths = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
] as const;

const longMonths = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

export function formatLongDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} de ${longMonths[month - 1]} de ${year}`;
}

function getScheduleStatusKind(installment: ScheduleInstallment): ScheduleStatusKind {
  const kinds: Readonly<Record<InstallmentStatus, ScheduleStatusKind>> = {
    PAGADA: "paid",
    PENDIENTE: "pending",
    VENCIDA: "overdue",
    EN_MORA: "late",
    EN_REVISION: "review",
  };
  const kind = kinds[installment.status];
  return kind === "pending" && installment.isNext ? "next" : kind;
}

export type ScheduleItem = Readonly<{
  id: string;
  numberLabel: string;
  day: string;
  month: string;
  /** "Vence el 7 de octubre de 2026" (lectores de pantalla). */
  dueDateLabel: string;
  /** Texto completo para lectores de pantalla. */
  accessibleLabel: string;
  amount: string;
  status: Readonly<{ kind: ScheduleStatusKind; label: string }>;
  paidOnLabel: string | null;
  /** Se puede tocar para pagar (pendiente, vencida o en mora). */
  isPayable: boolean;
}>;

export type ConsumptionDetailViewModel = Readonly<{
  header: Readonly<{
    label: string;
    icon: ConsumptionDetail["consumption"]["icon"];
    statusLabel: string;
    tone: ConsumptionCardTone;
    /** "3 cuotas · cada 15 días" */
    installmentsSummary: string;
    pendingCapital: string;
  }>;
  schedule: readonly ScheduleItem[];
  isPaid: boolean;
  hasPaymentInReview: boolean;
  /** Plazo total vencido: solo se puede pagar todo. */
  isOverdue: boolean;
}>;

function toScheduleItem(installment: ScheduleInstallment): ScheduleItem {
  const [, month, day] = installment.dueDate.split("-").map(Number);
  const kind = getScheduleStatusKind(installment);
  const numberLabel = formatInstallmentNumber(installment.number);
  const amount = formatBolivars(installment.amount.bs);
  const statusLabel = scheduleStatusLabels[kind];
  const paidOnLabel = installment.paidOn ? `Pagada el ${formatShortDate(installment.paidOn)}` : null;

  return {
    id: installment.installmentId,
    numberLabel,
    day: String(day).padStart(2, "0"),
    month: shortMonths[month - 1],
    dueDateLabel: `Vence el ${formatLongDate(installment.dueDate)}`,
    accessibleLabel: [
      numberLabel,
      `vence el ${formatLongDate(installment.dueDate)}`,
      amount,
      statusLabel,
      paidOnLabel,
    ].filter(Boolean).join(", "),
    amount,
    status: { kind, label: statusLabel },
    paidOnLabel,
    isPayable: kind === "next" || kind === "pending" || kind === "overdue" || kind === "late",
  };
}

export function createConsumptionDetailViewModel(
  detail: ConsumptionDetail,
): ConsumptionDetailViewModel {
  const { consumption, installments, debt } = detail;
  const total = consumption.totalInstallments;
  const unpaid = installments.filter((item) => item.status !== "PAGADA");
  const status = consumptionStatusPresentation[consumption.status];
  const isPaid = consumption.status === "PAGADO" || unpaid.length === 0;
  const totalLabel = `${total} ${total === 1 ? "cuota" : "cuotas"}`;

  return {
    header: {
      label: consumption.label,
      icon: consumption.icon,
      statusLabel: isPaid ? consumptionStatusPresentation.PAGADO.label : status.label,
      tone: isPaid ? "positive" : status.tone,
      installmentsSummary: consumption.everyDays
        ? `${totalLabel} · cada ${consumption.everyDays} días`
        : totalLabel,
      pendingCapital: formatBolivars(debt.allPending?.breakdown.capital.bs ?? "0.00"),
    },
    schedule: [...installments]
      .sort((left, right) => left.number - right.number)
      .map(toScheduleItem),
    isPaid,
    hasPaymentInReview: installments.some((item) => item.status === "EN_REVISION"),
    isOverdue: consumption.status === "VENCIDO_CON_MORA",
  };
}
