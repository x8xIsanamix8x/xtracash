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
    imageAlt: "Personas iniciando un proceso digital",
    imageSrc: "/entry/onboarding-empieza.webp",
  },
  {
    title: "Te guiamos paso a paso",
    description: "Conoce qué necesitas y qué debes completar.",
    imageAlt: "Personas recibiendo orientación financiera",
    imageSrc: "/entry/onboarding-guiamos.webp",
  },
  {
    title: "Siempre sabes qué sigue",
    description: "Consulta el avance y los próximos pasos de tu solicitud.",
    imageAlt: "Personas revisando información financiera",
    imageSrc: "/entry/onboarding-sabes.webp",
  },
  // Banco Activo institutional messaging remains pending internal validation.
  {
    title: "Avanza con confianza",
    description: "Consulta la información de cada etapa antes de continuar.",
    imageAlt: "Persona usando un teléfono de forma segura",
    imageSrc: "/entry/onboarding-seguridad.webp",
  },
];
