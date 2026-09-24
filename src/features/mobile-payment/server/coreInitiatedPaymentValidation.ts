import type {
  FinancingInstallment,
  FinancingPlan,
  InitiatedPayment,
  PaymentIconId,
  ResolvedRecipient,
} from "../types";

const coreMoneyPattern = /^(\d+)(?:\.(\d{1,4}))?$/;
const decimalPattern = /^\d+(?:\.\d{1,4})?$/;
const exchangeRatePattern = /^\d+(?:\.\d{1,8})?$/;
const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
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

function normalizeCoreMoney(value: string): string | null {
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

function readCoreMoney(value: unknown): string | null {
  if (!isRecord(value) || typeof value.bs !== "string") return null;
  return normalizeCoreMoney(value.bs);
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const match = calendarDatePattern.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isDecimal(value: unknown): value is string {
  return typeof value === "string" && decimalPattern.test(value);
}

function parseCoreRecipient(
  value: unknown,
  requestRecipient: ResolvedRecipient,
): Readonly<{ recipient: ResolvedRecipient; bankName: string }> | null {
  if (!isRecord(value) || !isRecord(value.banco)) return null;
  if (
    !isNonEmptyString(value.nombre)
    || typeof value.banco.codigo !== "string"
    || !/^\d{4}$/.test(value.banco.codigo)
    || !isNonEmptyString(value.banco.nombre)
    || !isNonEmptyString(value.telefono)
    || (value.nacionalidad !== "V" && value.nacionalidad !== "J")
    || !isNonEmptyString(value.documento)
  ) {
    return null;
  }

  return {
    recipient: {
      id: requestRecipient.id,
      name: value.nombre.trim(),
      bankCode: value.banco.codigo,
      documentType: value.nacionalidad,
      documentNumber: value.documento.trim(),
      phone: value.telefono.trim(),
      saveToDirectory: requestRecipient.saveToDirectory,
    },
    bankName: value.banco.nombre.trim(),
  };
}

function parseInstallment(value: unknown): FinancingInstallment | null {
  if (
    !isRecord(value)
    || !isPositiveInteger(value.numero)
    || !isCalendarDate(value.vencimiento)
  ) {
    return null;
  }

  const amountBs = readCoreMoney(value.monto);
  if (amountBs === null) return null;

  return {
    number: value.numero,
    dueDate: value.vencimiento,
    amountBs,
  };
}

function parseFinancing(value: unknown): FinancingPlan | null {
  if (
    !isRecord(value)
    || !isPositiveInteger(value.nivel)
    || !isPositiveInteger(value.numeroCuotas)
    || !isPositiveInteger(value.pagosCadaDias)
    || !isPositiveInteger(value.plazoTotalDias)
    || !isNonNegativeInteger(value.diasSinInteres)
    || !isDecimal(value.interesMensual)
    || !isDecimal(value.interesDiario)
    || !isDecimal(value.interesAnual)
    || !isDecimal(value.moraMensual)
    || !isDecimal(value.moraDiaria)
    || !Array.isArray(value.cuotas)
  ) {
    return null;
  }

  const debtBs = readCoreMoney(value.deuda);
  const reconnectionFeeBs = readCoreMoney(value.comisionReconexion);
  const installments = value.cuotas.map(parseInstallment);
  if (
    debtBs === null
    || reconnectionFeeBs === null
    || installments.some((installment) => installment === null)
  ) {
    return null;
  }

  const parsedInstallments = installments as FinancingInstallment[];
  if (new Set(parsedInstallments.map((installment) => installment.number)).size
    !== parsedInstallments.length) {
    return null;
  }

  return {
    level: value.nivel,
    installmentCount: value.numeroCuotas,
    debtBs,
    paymentEveryDays: value.pagosCadaDias,
    totalTermDays: value.plazoTotalDias,
    interestFreeDays: value.diasSinInteres,
    monthlyInterestRate: value.interesMensual,
    dailyInterestRate: value.interesDiario,
    annualInterestRate: value.interesAnual,
    monthlyLateFeeRate: value.moraMensual,
    dailyLateFeeRate: value.moraDiaria,
    reconnectionFeeBs,
    installments: parsedInstallments,
  };
}

export function parseCoreInitiatedPayment(
  value: unknown,
  requestRecipient: ResolvedRecipient,
  requestIconId: PaymentIconId | null,
): InitiatedPayment | null {
  if (
    !isRecord(value)
    || !isRecord(value.comision)
    || !isRecord(value.tasa)
    || !isRecord(value.data)
  ) {
    return null;
  }

  const amountBs = readCoreMoney(value.monto);
  const feeBs = readCoreMoney(value.comision);
  const totalBs = readCoreMoney(value.total);
  const availableBs = readCoreMoney(value.data.disponible);
  const dataAmountBs = readCoreMoney({ bs: value.data.monto });
  const beneficiary = parseCoreRecipient(
    value.data.beneficiario,
    requestRecipient,
  );
  const financing = parseFinancing(value.data.financiamiento);

  if (
    !isUuid(value.operacionId)
    || !isNonEmptyString(value.estado)
    || (value.canal !== "MISMO_BANCO" && value.canal !== "OTRA_ENTIDAD")
    || amountBs === null
    || feeBs === null
    || totalBs === null
    || availableBs === null
    || dataAmountBs !== amountBs
    || !isDecimal(value.comision.porcentaje)
    || typeof value.tasa.valor !== "string"
    || !exchangeRatePattern.test(value.tasa.valor)
    || !isCalendarDate(value.tasa.fecha)
    || !isNonEmptyString(value.tasa.fuente)
    || !isNonEmptyString(value.expiraEn)
    || Number.isNaN(Date.parse(value.expiraEn))
    || !isNonEmptyString(value.data.etiqueta)
    || beneficiary === null
    || financing === null
  ) {
    return null;
  }

  return {
    operationId: value.operacionId,
    status: value.estado.trim(),
    channel: value.canal,
    amountBs,
    feeBs,
    feePercentage: value.comision.porcentaje,
    totalBs,
    rateValue: value.tasa.valor,
    rateDate: value.tasa.fecha,
    rateSource: value.tasa.fuente.trim(),
    expiresAt: value.expiraEn,
    availableBs,
    label: value.data.etiqueta.trim(),
    iconId: requestIconId,
    recipientBankName: beneficiary.bankName,
    financing,
    recipient: beneficiary.recipient,
  };
}
