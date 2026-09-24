import type { MobilePaymentAccessStatus } from "./types";

export function isMobilePaymentAccessAllowed(
  status: MobilePaymentAccessStatus,
): boolean {
  return status === "active";
}

export function getMobilePaymentRestrictionMessage(
  status: MobilePaymentAccessStatus,
): string | null {
  if (status === "suspended") {
    return "No puedes solicitar un Pago Móvil porque tu cuenta está suspendida.";
  }

  if (status === "blocked") {
    return "No puedes solicitar un Pago Móvil porque tu cuenta está bloqueada.";
  }

  return null;
}
