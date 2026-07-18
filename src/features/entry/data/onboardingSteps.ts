export type OnboardingVisualKey = "digital-request" | "requirements" | "tracking" | "verification";

export type OnboardingStep = Readonly<{
  title: string;
  description: string;
  visualKey: OnboardingVisualKey;
  imageAlt: string;
}>;

export const onboardingSteps: readonly OnboardingStep[] = [
  {
    title: "Tu crédito empieza aquí",
    description: "Inicia tu solicitud directamente desde el teléfono.",
    visualKey: "digital-request",
    imageAlt: "Solicitud digital desde un teléfono",
  },
  {
    title: "Te guiamos paso a paso",
    description: "Conoce qué necesitas y qué debes completar.",
    visualKey: "requirements",
    imageAlt: "Lista organizada de pasos y requisitos",
  },
  {
    title: "Siempre sabes qué sigue",
    description: "Consulta el avance y los próximos pasos de tu solicitud.",
    visualKey: "tracking",
    imageAlt: "Seguimiento del estado de una solicitud",
  },
  // Banco Activo institutional messaging remains pending internal validation.
  {
    title: "Avanza con confianza",
    description: "Consulta la información de cada etapa antes de continuar.",
    visualKey: "verification",
    imageAlt: "Escudo de verificación y confianza",
  },
];
