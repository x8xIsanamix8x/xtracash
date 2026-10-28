export type CreditLineStatus =
  | "AL_DIA"
  | "CON_MORA"
  | "LIMITE_REDUCIDO"
  | "BLOQUEADA";

type CreditLineStatusTone = "success" | "error" | "warning";

type CreditLineNotice = Readonly<{
  title: string;
  description: string;
  actionLabel: "Reportar pago";
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
  AL_DIA: {
    label: "Activa",
    accessibleMessage: "Tu financiamiento está activo.",
    tone: "success",
    notice: null,
  },
  CON_MORA: {
    label: "Pago pendiente",
    accessibleMessage:
      "Tu financiamiento tiene un pago pendiente y continúa disponible.",
    tone: "warning",
    notice: {
      title: "Tienes un pago pendiente",
      description:
        "Puedes seguir utilizando tu disponible y reportar el pago cuando lo realices.",
      actionLabel: "Reportar pago",
    },
  },
  LIMITE_REDUCIDO: {
    label: "Disponible limitado",
    accessibleMessage:
      "Tu disponible está limitado. Puedes utilizar el monto informado.",
    tone: "warning",
    notice: {
      title: "Tu disponible está limitado",
      description:
        "Puedes utilizar el disponible informado y reportar un pago pendiente cuando lo realices.",
      actionLabel: "Reportar pago",
    },
  },
  BLOQUEADA: {
    label: "Bloqueada",
    accessibleMessage:
      "Tu financiamiento está bloqueado y no permite realizar Pago Móvil.",
    tone: "error",
    notice: {
      title: "Tu financiamiento está bloqueado",
      description:
        "No puedes realizar Pago Móvil en este momento. Puedes seguir consultando la información de tu financiamiento.",
      actionLabel: "Reportar pago",
    },
  },
};

/**
 * Prevalidación visual. El backend deberá validar nuevamente el estado y el
 * disponible antes de procesar una solicitud de Pago Móvil.
 */
export function isCreditLineUsable(status: CreditLineStatus) {
  return (
    status === "AL_DIA"
    || status === "CON_MORA"
    || status === "LIMITE_REDUCIDO"
  );
}
