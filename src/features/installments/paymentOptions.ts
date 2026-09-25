import { formatShortDate } from "../home/newBusinessViewModel";
import { formatBolivars } from "../home/presentation";
import { formatInstallmentNumber } from "./presentation";
import type { PaymentOption, PaymentOptionKind, PaymentQuote } from "./types";

/** La opción que el usuario eligió: la que viaja al reporte (`option` + `installmentCount`). */
export type PaymentSelection = Readonly<{
  option: PaymentOptionKind;
  /** Solo con `CUOTAS`. */
  installmentCount?: number;
}>;

export type PaymentChoice = Readonly<{
  kind: PaymentOptionKind;
  label: string;
  amount: string;
  /** P. ej. "Cuota 01 · vence el 7 oct." */
  description: string;
}>;

export type PaymentChoices = Readonly<{
  choices: readonly PaymentChoice[];
  /** Límites del contador de "Elegir cuántas cuotas"; nulo si esa opción no aplica. */
  countRange: Readonly<{ min: number; max: number }> | null;
  /** Plazo total vencido: solo se admite pagar todo. */
  onlyAllPending: boolean;
  defaultSelection: PaymentSelection;
}>;

function describeOption(option: PaymentOption): string {
  const first = option.installments[0];
  const last = option.installments[option.installments.length - 1];
  const range = first === last
    ? formatInstallmentNumber(first)
    : `${formatInstallmentNumber(first)} a ${String(last).padStart(2, "0")}`;
  return `${range} · hasta el ${formatShortDate(option.lastDueDate)}`;
}

/** La opción de `options[]` que cubre `count` cuotas. */
function optionForCount(quote: PaymentQuote, count: number): PaymentOption | null {
  return quote.options.find((option) => option.installmentCount === count) ?? null;
}

export function createPaymentChoices(quote: PaymentQuote): PaymentChoices | null {
  if (!quote.hasDebt || quote.allPending === null) return null;

  const all = quote.allPending;
  const next = quote.nextInstallment;

  if (next === null) {
    return {
      choices: [{
        kind: "TODAS",
        label: "Todas las pendientes",
        amount: formatBolivars(all.total.bs),
        description: describeOption(all),
      }],
      countRange: null,
      onlyAllPending: true,
      defaultSelection: { option: "TODAS" },
    };
  }

  const nextChoice: PaymentChoice = {
    kind: "PROXIMA",
    label: "Próxima cuota",
    amount: formatBolivars(next.total.bs),
    description: describeOption(next),
  };

  // Con una sola cuota pendiente, "todas" sería la misma cifra.
  if (all.installmentCount <= 1) {
    return {
      choices: [nextChoice],
      countRange: null,
      onlyAllPending: false,
      defaultSelection: { option: "PROXIMA" },
    };
  }

  // Elegir N tiene sentido entre 2 y todas menos una (N = todas es "Todas las pendientes").
  const countable = quote.options
    .map((option) => option.installmentCount)
    .filter((count) => count >= 2 && count < all.installmentCount);
  const countRange = countable.length > 0
    ? { min: Math.min(...countable), max: Math.max(...countable) }
    : null;

  const choices: PaymentChoice[] = [nextChoice];
  if (countRange) {
    const firstCountOption = optionForCount(quote, countRange.min)!;
    choices.push({
      kind: "CUOTAS",
      label: "Elegir cuántas cuotas",
      amount: formatBolivars(firstCountOption.total.bs),
      description: describeOption(firstCountOption),
    });
  }
  choices.push({
    kind: "TODAS",
    label: "Todas las pendientes",
    amount: formatBolivars(all.total.bs),
    description: describeOption(all),
  });

  return {
    choices,
    countRange,
    onlyAllPending: false,
    defaultSelection: { option: "PROXIMA" },
  };
}

/**
 * Ajusta una selección guardada a lo que hoy permite el consumo: en mora pasa a
 * `TODAS`; un `installmentCount` fuera de rango se lleva al límite más cercano.
 */
export function normalizePaymentSelection(
  choices: PaymentChoices,
  selection: PaymentSelection | null | undefined,
): PaymentSelection {
  if (!selection || !choices.choices.some((choice) => choice.kind === selection.option)) {
    return choices.defaultSelection;
  }
  if (selection.option !== "CUOTAS") return { option: selection.option };

  const range = choices.countRange!;
  const count = Math.min(range.max, Math.max(range.min, selection.installmentCount ?? range.min));
  return { option: "CUOTAS", installmentCount: count };
}

export function getSelectedOption(
  quote: PaymentQuote,
  selection: PaymentSelection,
): PaymentOption | null {
  if (selection.option === "PROXIMA") return quote.nextInstallment;
  if (selection.option === "TODAS") return quote.allPending;
  return optionForCount(quote, selection.installmentCount ?? 0);
}

export type BreakdownLine = Readonly<{ label: string; amount: string }>;

export type AmountBreakdown = Readonly<{
  lines: readonly BreakdownLine[];
  total: string;
  /** Monto exacto a transferir y reportar, p. ej. `"34372.09"`. */
  totalBs: string;
  interestFree: boolean;
  description: string;
}>;

function isPositive(amount: string) {
  return Number(amount) > 0;
}

/** Capital siempre; interés, mora y reactivación solo cuando hay cargo. */
export function createAmountBreakdown(option: PaymentOption): AmountBreakdown {
  const { capital, interest, lateFee, reconnection } = option.breakdown;
  const lines: BreakdownLine[] = [{ label: "Capital", amount: formatBolivars(capital.bs) }];
  if (isPositive(interest.bs)) lines.push({ label: "Interés generado", amount: formatBolivars(interest.bs) });
  if (isPositive(lateFee.bs)) lines.push({ label: "Mora", amount: formatBolivars(lateFee.bs) });
  if (isPositive(reconnection.bs)) {
    lines.push({ label: "Cargo de reactivación", amount: formatBolivars(reconnection.bs) });
  }

  return {
    lines,
    total: formatBolivars(option.total.bs),
    totalBs: option.total.bs,
    interestFree: option.interestFree,
    description: describeOption(option),
  };
}

/** Desde dónde se abrió el pago: define a dónde lleva "volver" (`?from=list`). */
export type PaymentOrigin = "list" | "detail";

export function parsePaymentOrigin(value: string | null | undefined): PaymentOrigin {
  return value === "list" ? "list" : "detail";
}

export function paymentSelectionToQuery(
  selection: PaymentSelection,
  origin: PaymentOrigin = "detail",
): string {
  const query = new URLSearchParams({ option: selection.option });
  if (selection.option === "CUOTAS" && selection.installmentCount) {
    query.set("count", String(selection.installmentCount));
  }
  if (origin === "list") query.set("from", "list");
  return query.toString();
}

/** A dónde vuelve el pago: a "Próximas cuotas" si se abrió desde ahí; si no, al detalle. */
export function paymentBackLink(consumptionId: string, origin: PaymentOrigin) {
  return origin === "list"
    ? { href: "/installments", label: "Volver a mis cuotas" }
    : { href: `/installments/${consumptionId}`, label: "Volver al detalle" };
}

/** Lee `?option=&count=` (sin validar contra el consumo: eso lo hace `normalizePaymentSelection`). */
export function parsePaymentSelectionQuery(
  option: string | null | undefined,
  count: string | null | undefined,
): PaymentSelection | null {
  if (option === "PROXIMA" || option === "TODAS") return { option };
  if (option !== "CUOTAS") return null;
  const installmentCount = Number(count);
  return Number.isInteger(installmentCount) && installmentCount > 0
    ? { option, installmentCount }
    : { option };
}
