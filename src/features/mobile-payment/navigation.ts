import type { AppDestination } from "@/components/AppBottomNavigation";

import type { MobilePaymentStep, PaymentIconId, RecipientMode } from "./types";

type PaymentProgress = Readonly<{
  amount: string;
  concept?: string;
  recipientMode: RecipientMode;
  selectedContactId: string | null;
  selectedIcon?: PaymentIconId | null;
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
  concept = "",
  recipientMode,
  selectedContactId,
  selectedIcon = null,
  step,
}: PaymentProgress): boolean {
  return step !== "details"
    || recipientMode !== "choice"
    || selectedContactId !== null
    || amount !== ""
    || concept.trim() !== ""
    || selectedIcon !== null;
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
