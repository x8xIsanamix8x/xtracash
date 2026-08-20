import type { CreditLineStatus } from "@/features/credit-line";

export type ActivityKind = "approval" | "processing" | "rejection";

export type CoreMovementType =
  | "CREDITO_APROBADO"
  | "CREDITO_RECHAZADO"
  | "CREDITO_PROCESO";

export type RecentActivityItem = Readonly<{
  id: string;
  kind: ActivityKind;
  title: string;
  amount: string;
  date: string;
}>;

export type FinancingSummary = Readonly<{
  status: CreditLineStatus;
  assignedLimit: string;
  available: string;
  currentDebt: string;
  minimumPayment: string;
  nextCutDate: string;
  hasPendingPayment: boolean;
}>;

export type HomeAccountProduct = Readonly<{
  limitBs: string;
  availableBs: string;
}>;

export type HomeAccountPayments = Readonly<{
  hasPendingPayment: boolean;
  nextCutoffDate: string | null;
  currentDebtBs: string | null;
  minimumPaymentBs: string | null;
  delinquencyStage: CreditLineStatus;
}>;

export type HomeAccountMovement = Readonly<{
  type: CoreMovementType;
  date: string;
  amountBs: string;
}>;

export type HomeAccountSummary = Readonly<{
  name: string;
  accountStatus: string;
  product: HomeAccountProduct | null;
  payments: HomeAccountPayments;
  movements: readonly HomeAccountMovement[];
}>;
