import type { AppDestination } from "@/components/AppBottomNavigation";

import type { MobilePaymentStep, RecipientMode } from "./types";

type PaymentProgress = Readonly<{
  amount: string;
  recipientMode: RecipientMode;
  selectedContactId: string | null;
  step: MobilePaymentStep;
}>;

type NavigationDecisionInput = Readonly<{
  destination: AppDestination;
  hasEnteredData: boolean;
  isTransactionPending: boolean;
  step: MobilePaymentStep;
}>;

export type MobilePaymentNavigationDecision = "allow" | "confirm" | "stay";

export function hasMobilePaymentProgress({
  amount,
  recipientMode,
  selectedContactId,
  step,
}: PaymentProgress): boolean {
  return step !== "details"
    || recipientMode !== "choice"
    || selectedContactId !== null
    || amount !== "";
}

export function getMobilePaymentNavigationDecision({
  destination,
  hasEnteredData,
  isTransactionPending,
  step,
}: NavigationDecisionInput): MobilePaymentNavigationDecision {
  if (isTransactionPending || destination === "mobile-payment") return "stay";
  if (step === "result" || !hasEnteredData) return "allow";
  return "confirm";
}
