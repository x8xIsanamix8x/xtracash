export const pendingPaymentReportPresentation = {
  title: "Pago en revisión",
  message: "Ya tienes un pago en revisión. Espera a que el equipo de Impulsa lo valide antes de reportar otro.",
  primaryAction: "back_home",
  primaryActionLabel: "Volver al inicio",
  allowsRetry: false,
} as const;

export function getSubmissionFailureStep(
  errorType: string,
): "form" | "pending" {
  return errorType === "pending" ? "pending" : "form";
}

export function runPendingPrimaryAction(onBackHome: () => void): void {
  onBackHome();
}
