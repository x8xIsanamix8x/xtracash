export type CreditLineStatus = "active" | "blocked" | "suspended";

type CreditLineStatusTone = "success" | "error" | "warning";

type CreditLineNotice = Readonly<{
  title: string;
  description: string;
  actionLabel: string;
}>;

type CreditLineStatusDefinition = Readonly<{
  label: string;
  accessibleMessage: string;
  tone: CreditLineStatusTone;
  notice: CreditLineNotice | null;
}>;

export const creditLineStatusConfig: Record<
  CreditLineStatus,
  CreditLineStatusDefinition
> = {
  active: {
    label: "Activa",
    accessibleMessage: "Tu línea está activa.",
    tone: "success",
    notice: null,
  },
  blocked: {
    label: "Bloqueada",
    accessibleMessage: "Tu línea está bloqueada.",
    tone: "error",
    notice: {
      title: "Tu línea está bloqueada",
      description:
        "Tienes un pago vencido. Realiza el pago pendiente para regularizar tu línea.",
      actionLabel: "Pagar deuda",
    },
  },
  suspended: {
    label: "Suspendida",
    accessibleMessage: "Tu línea está suspendida.",
    tone: "warning",
    notice: {
      title: "Tu línea está suspendida temporalmente",
      description:
        "Por ahora no puedes enviar dinero. Consulta Ayuda para conocer los próximos pasos.",
      actionLabel: "Consultar Ayuda",
    },
  },
};

/**
 * Prevalidación visual para flujos de disposición. El backend deberá volver a
 * validar el estado antes de procesar cualquier transacción.
 */
export function isCreditLineUsable(status: CreditLineStatus) {
  return status === "active";
}
