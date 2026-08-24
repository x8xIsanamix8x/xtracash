import { formatBolivars } from "@/features/home/presentation";

import type {
  CreditMovement,
  CreditMovementDayGroup,
  CreditMovementFilters,
  CreditMovementItem,
  CreditMovementMonthGroup,
  CreditMovementStatus,
  CreditMovementStatusFilter,
  CreditMovementType,
  CreditMovementTypeFilter,
} from "./types";

const caracasDatePartsFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const caracasNumericDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Caracas",
  year: "numeric",
  month: "2-digit",
});
const caracasShortDateFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "numeric",
  month: "short",
});
const caracasTimeFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const typeLabels: Record<CreditMovementType, string> = {
  CREDITO: "Pago móvil realizado",
  REPORTE_PAGO: "Pago reportado",
};

const statusLabels: Record<CreditMovementStatus, string> = {
  APROBADO: "Aprobado",
  PENDIENTE: "Pendiente",
  RECHAZADO: "Rechazado",
};

export const movementTypeFilterOptions: readonly Readonly<{
  value: CreditMovementTypeFilter;
  label: string;
}>[] = [
  { value: "all", label: "Todos" },
  { value: "CREDITO", label: "Créditos" },
  { value: "REPORTE_PAGO", label: "Pagos reportados" },
];

export const movementStatusFilterOptions: readonly Readonly<{
  value: CreditMovementStatusFilter;
  label: string;
}>[] = [
  { value: "all", label: "Todos" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "APROBADO", label: "Aprobados" },
  { value: "RECHAZADO", label: "Rechazados" },
];

type CaracasDateParts = Readonly<{
  year: string;
  month: string;
  monthNumber: string;
  day: string;
}>;

function capitalize(value: string): string {
  return value
    ? `${value.charAt(0).toLocaleUpperCase("es-VE")}${value.slice(1)}`
    : value;
}

function readCaracasDateParts(value: string): CaracasDateParts {
  const date = new Date(value);
  const parts = caracasDatePartsFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const numericParts = caracasNumericDatePartsFormatter.formatToParts(date);
  const monthNumber = numericParts.find(
    (part) => part.type === "month",
  )?.value ?? "";
  return { year, month, monthNumber, day };
}

export function getCaracasMonthKey(value: string): string {
  const { year, monthNumber } = readCaracasDateParts(value);
  return `${year}-${monthNumber}`;
}

export function getCaracasDayKey(value: string): string {
  const { year, monthNumber, day } = readCaracasDateParts(value);
  return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
}

export function formatMovementMonthHeader(value: string): string {
  const { year, month } = readCaracasDateParts(value);
  return `${capitalize(month)} ${year}`;
}

export function formatMovementDayHeader(value: string): string {
  const { day, month } = readCaracasDateParts(value);
  return `${day} de ${month}`;
}

export function formatMovementDate(value: string): string {
  const date = new Date(value);
  const shortDate = caracasShortDateFormatter
    .format(date)
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${shortDate} · ${caracasTimeFormatter.format(date)}`;
}

function findLabel<T extends string>(
  options: readonly Readonly<{ value: T; label: string }>[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? "Todos";
}

export function getMovementFilterLabel(
  filters: CreditMovementFilters,
): string {
  const typeLabel = findLabel(movementTypeFilterOptions, filters.type);
  const statusLabel = findLabel(movementStatusFilterOptions, filters.status);
  if (filters.type === "all" && filters.status === "all") return "Todos";
  if (filters.type === "all") return statusLabel;
  if (filters.status === "all") return typeLabel;
  return `${typeLabel} · ${statusLabel}`;
}

function presentMovement(movement: CreditMovement): CreditMovementItem {
  return {
    ...movement,
    typeLabel: typeLabels[movement.type],
    statusLabel: statusLabels[movement.status],
    amount: formatBolivars(movement.amountBs),
    displayDate: formatMovementDate(movement.occurredAt),
  };
}

export function createMovementGroups(
  movements: readonly CreditMovement[],
): readonly CreditMovementMonthGroup[] {
  const sortedMovements = movements
    .map((movement, originalIndex) => ({ movement, originalIndex }))
    .sort((left, right) => (
      Date.parse(right.movement.occurredAt) - Date.parse(left.movement.occurredAt)
      || left.originalIndex - right.originalIndex
    ));
  const months = new Map<
    string,
    {
      label: string;
      days: Map<string, CreditMovementDayGroup>;
    }
  >();

  sortedMovements.forEach(({ movement }) => {
    const monthKey = getCaracasMonthKey(movement.occurredAt);
    const dayKey = getCaracasDayKey(movement.occurredAt);
    const month = months.get(monthKey) ?? {
      label: formatMovementMonthHeader(movement.occurredAt),
      days: new Map<string, CreditMovementDayGroup>(),
    };
    const day = month.days.get(dayKey) ?? {
      date: dayKey,
      label: formatMovementDayHeader(movement.occurredAt),
      items: [],
    };
    month.days.set(dayKey, {
      ...day,
      items: [...day.items, presentMovement(movement)],
    });
    months.set(monthKey, month);
  });

  return Array.from(months, ([month, group]) => ({
    month,
    label: group.label,
    days: Array.from(group.days.values()),
  }));
}
