export type OnboardingStep = Readonly<{
  title: string;
  description: string;
  imageAlt: string;
  imageSrc: string;
}>;

export const onboardingSteps: readonly OnboardingStep[] = [
  {
    title: "Tu crédito empieza aquí",
    description: "Inicia tu solicitud directamente desde el teléfono.",
    imageAlt: "Teleférico avanzando desde la ciudad hacia la montaña",
    imageSrc: "/entry/onboarding-empieza.webp",
  },
  {
    title: "Te guiamos paso a paso",
    description: "Conoce qué necesitas y qué debes completar.",
    imageAlt: "Teleférico avanzando entre montañas",
    imageSrc: "/entry/onboarding-guiamos.webp",
  },
  {
    title: "Siempre sabes qué sigue",
    description: "Consulta el avance y los próximos pasos de tu solicitud.",
    imageAlt: "Teleférico recorriendo una ruta de montaña",
    imageSrc: "/entry/onboarding-sabes.webp",
  },
  // Banco Activo institutional messaging remains pending internal validation.
  {
    title: "Avanza con confianza",
    description: "Consulta la información de cada etapa antes de continuar.",
    imageAlt: "Teleférico llegando a la cima de la montaña",
    imageSrc: "/entry/onboarding-seguridad.webp",
  },
];
