import {
  isCalendarDateString,
  isNonEmptyString,
  isRecord,
  isUuid,
  normalizeAmount,
  parseConsumptionDetail,
  parseConsumptionStatus,
  parseIcon,
  parseInstallmentStatus,
  parseMoney,
  parsePaymentOption,
  parseSourceBank,
} from "../contractValidation";
import type {
  ConsumptionDetail,
  ConsumptionStatus,
  InstallmentReportResult,
  InstallmentsConsumption,
  InstallmentsOverview,
  Money,
  PaymentData,
  PaymentOption,
  PendingInstallment,
  SourceBank,
} from "../types";

/** Una fila de `GET /api/impulsate-movil/cuotas`. */
export type CoreUnpaidInstallment = Readonly<{
  consumptionId: string;
  label: string;
  icon: unknown;
  installment: PendingInstallment;
}>;

/** Un consumo de `GET /api/impulsate-movil/financiamientos`. */
export type CoreFinancing = Readonly<{
  consumptionId: string;
  label: string;
  status: ConsumptionStatus;
  consumedOn: string;
  amount: Money;
  totalInstallments: number;
  paidInstallments: number;
}>;

export type CoreProblem = Readonly<{
  code: string | null;
  expectedAmountBs: string | null;
  reportedAmountBs: string | null;
}>;

function parseCoreUnpaidInstallment(value: unknown): CoreUnpaidInstallment | null {
  if (!isRecord(value)) return null;
  const amount = parseMoney(value.amount);
  const status = parseInstallmentStatus(value.status);
  if (
    !isUuid(value.installmentId)
    || !isUuid(value.consumptionId)
    || !isNonEmptyString(value.label)
    || typeof value.number !== "number"
    || !Number.isInteger(value.number)
    || value.number < 1
    || !isCalendarDateString(value.dueDate)
    || typeof value.isNext !== "boolean"
    || !amount
    || status === null
    || status === "PAGADA"
  ) {
    return null;
  }

  return {
    consumptionId: value.consumptionId,
    label: value.label.trim(),
    icon: value.icon,
    installment: {
      installmentId: value.installmentId,
      number: value.number,
      dueDate: value.dueDate,
      amount,
      status,
      isNext: value.isNext,
    },
  };
}

export function parseCoreUnpaidInstallments(
  value: unknown,
): readonly CoreUnpaidInstallment[] | null {
  if (!isRecord(value) || !Array.isArray(value.installments)) return null;
  const items = value.installments.map(parseCoreUnpaidInstallment);
  return items.some((item) => item === null)
    ? null
    : items as CoreUnpaidInstallment[];
}

function parseCoreFinancing(value: unknown): CoreFinancing | null {
  if (!isRecord(value) || !Array.isArray(value.cuotas)) return null;
  const amount = parseMoney(value.montoSolicitado);
  const status = parseConsumptionStatus(value.estado);
  const installmentStatuses = value.cuotas.map((cuota) => (
    isRecord(cuota) ? parseInstallmentStatus(cuota.estado) : null
  ));

  if (
    !isUuid(value.consumoId)
    || !isNonEmptyString(value.etiqueta)
    || !isCalendarDateString(value.fecha)
    || typeof value.numeroCuotas !== "number"
    || !Number.isInteger(value.numeroCuotas)
    || value.numeroCuotas < 1
    || !amount
    || status === null
    || installmentStatuses.some((item) => item === null)
  ) {
    return null;
  }

  return {
    consumptionId: value.consumoId,
    label: value.etiqueta.trim(),
    status,
    consumedOn: value.fecha,
    amount,
    totalInstallments: value.numeroCuotas,
    paidInstallments: installmentStatuses.filter((item) => item === "PAGADA").length,
  };
}

export function parseCoreFinancings(value: unknown): readonly CoreFinancing[] | null {
  if (!isRecord(value) || !Array.isArray(value.financiamientos)) return null;
  const items = value.financiamientos.map(parseCoreFinancing);
  return items.some((item) => item === null) ? null : items as CoreFinancing[];
}

/**
 * Mis cuotas: los consumos con cuotas sin pagar, en el orden de `/financiamientos`
 * (del más viejo al más nuevo). Un consumo que solo aparezca en `/cuotas` va al
 * final en vez de perderse.
 */
export function combineInstallmentsOverview(
  financings: readonly CoreFinancing[],
  unpaidInstallments: readonly CoreUnpaidInstallment[],
): InstallmentsOverview {
  const byConsumption = new Map<string, CoreUnpaidInstallment[]>();
  for (const item of unpaidInstallments) {
    const group = byConsumption.get(item.consumptionId) ?? [];
    group.push(item);
    byConsumption.set(item.consumptionId, group);
  }

  const toConsumption = (
    group: readonly CoreUnpaidInstallment[],
    financing: CoreFinancing | null,
  ): InstallmentsConsumption => ({
    consumptionId: group[0].consumptionId,
    label: financing?.label ?? group[0].label,
    icon: parseIcon(group[0].icon),
    consumedOn: financing?.consumedOn ?? null,
    amount: financing?.amount ?? null,
    totalInstallments: financing?.totalInstallments ?? null,
    paidInstallments: financing?.paidInstallments ?? null,
    status: financing?.status ?? null,
    pendingInstallments: group
      .map((item) => item.installment)
      .sort((left, right) => left.number - right.number),
  });

  const consumptions: InstallmentsConsumption[] = [];
  for (const financing of financings) {
    const group = byConsumption.get(financing.consumptionId);
    if (!group) continue;
    consumptions.push(toConsumption(group, financing));
    byConsumption.delete(financing.consumptionId);
  }
  for (const group of byConsumption.values()) {
    consumptions.push(toConsumption(group, null));
  }

  return { consumptions };
}

/** `GET /api/impulsate-movil/consumos/{id}`: se renombra `installments` (total). */
export function parseCoreConsumptionDetail(value: unknown): ConsumptionDetail | null {
  if (!isRecord(value) || !isRecord(value.consumption)) return null;
  return parseConsumptionDetail({
    ...value,
    consumption: {
      ...value.consumption,
      totalInstallments: value.consumption.installments,
    },
  });
}

function parseNullableOption(value: unknown): { ok: boolean; value: PaymentOption | null } {
  if (value === null || value === undefined) return { ok: true, value: null };
  const option = parsePaymentOption(value);
  return { ok: option !== null, value: option };
}

function optionalText(value: unknown): string | null {
  return isNonEmptyString(value) ? value.trim() : null;
}

export function parseCoreBanks(value: unknown): readonly SourceBank[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const banks = value.map(parseSourceBank);
  return banks.some((bank) => bank === null) ? null : banks as SourceBank[];
}

/** `GET /api/impulsate-movil/datos-pago?consumptionId=...` + catálogo de bancos. */
export function parseCorePaymentData(
  value: unknown,
  sourceBanks: readonly SourceBank[],
): PaymentData | null {
  if (
    !isRecord(value)
    || !isRecord(value.consumption)
    || !isRecord(value.consumption.rate)
  ) {
    return null;
  }

  const consumption = value.consumption;
  const rate = consumption.rate as Record<string, unknown>;
  const hasDebt = consumption.code !== "SIN_DEUDA";
  const nextInstallment = parseNullableOption(consumption.nextInstallment);
  const allPending = parseNullableOption(consumption.allPending);
  const rawOptions = consumption.options ?? [];
  const options = Array.isArray(rawOptions) ? rawOptions.map(parsePaymentOption) : null;

  if (
    !isNonEmptyString(value.bank)
    || typeof value.bankCode !== "string"
    || !/^\d{4}$/.test(value.bankCode)
    || !isNonEmptyString(value.taxId)
    || !isNonEmptyString(value.phone)
    || !isCalendarDateString(consumption.paymentDate)
    || !isNonEmptyString(rate.bolivaresPerUsd)
    || !isCalendarDateString(rate.effectiveDate)
    || !nextInstallment.ok
    || !allPending.ok
    || options === null
    || options.some((option) => option === null)
    || (hasDebt && (allPending.value === null || options.length === 0))
  ) {
    return null;
  }

  return {
    destination: {
      bank: value.bank.trim(),
      bankCode: value.bankCode,
      taxId: value.taxId.trim(),
      phone: value.phone.trim(),
      beneficiaryName: optionalText(value.beneficiaryName),
      account: optionalText(value.account),
      accountType: optionalText(value.accountType),
    },
    quote: {
      paymentDate: consumption.paymentDate,
      rate: {
        bolivaresPerUsd: rate.bolivaresPerUsd.trim(),
        effectiveDate: rate.effectiveDate,
      },
      hasDebt,
      nextInstallment: hasDebt ? nextInstallment.value : null,
      allPending: hasDebt ? allPending.value : null,
      options: hasDebt ? options as PaymentOption[] : [],
    },
    sourceBanks,
  };
}

/** `201` de `POST /api/impulsate-movil/reportes-pago`. */
export function parseCoreReportCreated(
  value: unknown,
  receiptSent: boolean,
): InstallmentReportResult | null {
  if (!isRecord(value)) return null;
  const amount = parseMoney(value.amount);
  const reportedAmountBs = normalizeAmount(value.reportedAmount);
  if (
    !isNonEmptyString(value.id)
    || !amount
    || reportedAmountBs === null
    || !isCalendarDateString(value.paymentDate)
  ) {
    return null;
  }

  return {
    reportId: value.id,
    amount,
    reportedAmountBs,
    paymentDate: value.paymentDate,
    receiptAttached: receiptSent && isRecord(value.receipt),
  };
}

/** Cuerpo *problem+json* de un error de Core (`code`, `expectedAmount`...). */
export function parseCoreProblem(value: unknown): CoreProblem {
  if (!isRecord(value)) {
    return { code: null, expectedAmountBs: null, reportedAmountBs: null };
  }
  return {
    code: typeof value.code === "string" ? value.code : null,
    expectedAmountBs: isRecord(value.expectedAmount)
      ? normalizeAmount(value.expectedAmount.bs)
      : null,
    reportedAmountBs: normalizeAmount(value.reportedAmount),
  };
}
