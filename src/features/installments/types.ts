import type { PaymentIconId } from "../payment-purpose/types";

/** Montos canónicos con dos decimales, p. ej. `"34372.09"`. */
export type Money = Readonly<{
  bs: string;
  usd: string;
}>;

export type InstallmentStatus =
  | "PENDIENTE"
  | "VENCIDA"
  | "EN_MORA"
  | "EN_REVISION"
  | "PAGADA";

export type ConsumptionStatus =
  | "AL_DIA"
  | "VENCIDO_SIN_MORA"
  | "VENCIDO_CON_MORA"
  | "PAGADO";

export type PaymentOptionKind = "PROXIMA" | "CUOTAS" | "TODAS";

/** Una cuota sin pagar, como la devuelve `/cuotas`. */
export type PendingInstallment = Readonly<{
  installmentId: string;
  number: number;
  dueDate: string;
  amount: Money;
  status: Exclude<InstallmentStatus, "PAGADA">;
  isNext: boolean;
}>;

/** Card de Mis cuotas: un consumo con al menos una cuota sin pagar. */
export type InstallmentsConsumption = Readonly<{
  consumptionId: string;
  label: string;
  icon: PaymentIconId;
  /** Nulos solo si el consumo no vino en `/financiamientos`. */
  consumedOn: string | null;
  amount: Money | null;
  totalInstallments: number | null;
  paidInstallments: number | null;
  status: ConsumptionStatus | null;
  pendingInstallments: readonly PendingInstallment[];
}>;

export type InstallmentsOverview = Readonly<{
  /** Del consumo más viejo al más nuevo. Vacía si está al día. */
  consumptions: readonly InstallmentsConsumption[];
}>;

export type PaymentBreakdown = Readonly<{
  capital: Money;
  interest: Money;
  lateFee: Money;
  reconnection: Money;
}>;

export type PaymentOption = Readonly<{
  installmentCount: number;
  installments: readonly number[];
  lastDueDate: string;
  breakdown: PaymentBreakdown;
  total: Money;
  interestFree: boolean;
}>;

export type ScheduleInstallment = Readonly<{
  installmentId: string;
  number: number;
  dueDate: string;
  amount: Money;
  status: InstallmentStatus;
  isNext: boolean;
  paidOn: string | null;
}>;

export type ConsumptionDetail = Readonly<{
  consumption: Readonly<{
    consumptionId: string;
    label: string;
    icon: PaymentIconId;
    status: ConsumptionStatus;
    consumedOn: string;
    amount: Money;
    totalInstallments: number;
    everyDays: number | null;
    interestFreeDays: number | null;
  }>;
  installments: readonly ScheduleInstallment[];
  debt: Readonly<{
    nextInstallment: PaymentOption | null;
    allPending: PaymentOption | null;
  }>;
}>;

export type SourceBank = Readonly<{
  code: string;
  name: string;
}>;

export type PaymentDestination = Readonly<{
  bank: string;
  bankCode: string;
  taxId: string;
  phone: string;
  beneficiaryName: string | null;
  account: string | null;
  accountType: string | null;
}>;

export type PaymentQuote = Readonly<{
  paymentDate: string;
  rate: Readonly<{
    bolivaresPerUsd: string;
    effectiveDate: string;
  }>;
  /** `false` cuando Core responde `code: SIN_DEUDA`. */
  hasDebt: boolean;
  nextInstallment: PaymentOption | null;
  allPending: PaymentOption | null;
  /** Una por cantidad de cuotas: la primera cubre 1, la última todas. */
  options: readonly PaymentOption[];
}>;

export type PaymentData = Readonly<{
  destination: PaymentDestination;
  quote: PaymentQuote;
  sourceBanks: readonly SourceBank[];
}>;

export type PaymentReceipt = Readonly<{
  fileName: string;
  contentBase64: string;
}>;

export type CreateInstallmentReportRequest = Readonly<{
  option: PaymentOptionKind;
  /** Solo con `CUOTAS`. */
  installmentCount?: number;
  amountBs: string;
  senderBank: string;
  senderPhone: string;
  paymentDate: string;
  bankReference: string;
  receipt?: PaymentReceipt;
}>;

export type InstallmentReportResult = Readonly<{
  reportId: string;
  /** Lo que cuestan las cuotas a la fecha de pago. */
  amount: Money;
  reportedAmountBs: string;
  paymentDate: string;
  receiptAttached: boolean;
}>;
