import type { CreditLineStatus } from "@/features/credit-line";

export type ActivityKind = "payment" | "approval" | "adjustment";

export type RecentActivityItem = Readonly<{
  id: number;
  kind: ActivityKind;
  title: string;
  amount: string;
  date: string;
}>;

export type FinancingSummary = Readonly<{
  status: CreditLineStatus;
  assignedLimit: string;
  totalAvailable: string;
  usableAvailable: string;
  frozenAmount: string | null;
  currentDebt: string;
  minimumPayment: string;
  nextCutDate: string;
}>;
