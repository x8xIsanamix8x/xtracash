export type CreditLineStatus =
  | "ACTIVA"
  | "MORA_NIVEL_1"
  | "CONGELADA_NIVEL_2"
  | "BLOQUEADA_TERCER_CORTE"
  | "BLOQUEADA_RETIRO";

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
  ACTIVA: {
    label: "Activa",
    accessibleMessage: "Tu financiamiento está activo.",
    tone: "success",
    notice: null,
  },
  MORA_NIVEL_1: {
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
  CONGELADA_NIVEL_2: {
    label: "Disponible congelado",
    accessibleMessage:
      "Parte de tu disponible está congelada. Puedes utilizar el monto restante.",
    tone: "warning",
    notice: {
      title: "Parte de tu disponible está congelada",
      description:
        "Puedes utilizar únicamente el disponible restante y reportar el pago para su verificación.",
      actionLabel: "Reportar pago",
    },
  },
  BLOQUEADA_TERCER_CORTE: {
    label: "Bloqueada",
    accessibleMessage:
      "Tu financiamiento está bloqueado. Solo puedes consultar y reportar pagos.",
    tone: "error",
    notice: {
      title: "Tu financiamiento está bloqueado",
      description:
        "Por ahora solo puedes consultar la información y reportar pagos.",
      actionLabel: "Reportar pago",
    },
  },
  BLOQUEADA_RETIRO: {
    label: "Bloqueada",
    accessibleMessage:
      "Tu financiamiento no permite nuevas solicitudes. Puedes consultar y reportar pagos.",
    tone: "error",
    notice: {
      title: "Tu financiamiento no admite nuevas solicitudes",
      description:
        "Puedes continuar consultando la información y reportando pagos.",
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
    status === "ACTIVA"
    || status === "MORA_NIVEL_1"
    || status === "CONGELADA_NIVEL_2"
  );
}
