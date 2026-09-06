import type { OnboardingMasterProgress } from "@/features/home/types";

export const MASTER_ONBOARDING_URL = "https://onboarding.sandbox.impulsa.vc";

export type MasterOnboardingMessage = Readonly<{
  completed: boolean;
  percentage: number;
  title: string;
  description: string;
}>;

export function getMasterOnboardingMessage(
  progress: OnboardingMasterProgress,
): MasterOnboardingMessage {
  const percentage = Math.max(25, progress.completedPhases * 25);

  switch (progress.completedPhases) {
    case 0:
      return { completed: false, percentage, title: "¡Felicidades!", description: "Ya te registraste en Impúlsate Móvil y tienes el 25% de tu crédito disponible. Completa tu información para aumentar tu límite." };
    case 1:
      return { completed: false, percentage, title: "¡Excelente, vamos por buen camino!", description: `Ya tienes el ${percentage}% de tu crédito disponible. Completa tu información para continuar aumentando tu límite.` };
    case 2:
      return { completed: false, percentage, title: "Tu avance está creciendo", description: `Ya tienes el ${percentage}% de tu crédito disponible. Continúa con tu información para acceder a un límite mayor.` };
    case 3:
      return { completed: false, percentage, title: "¡Estás muy cerca!", description: `Ya tienes el ${percentage}% de tu crédito disponible. Completa la última fase para aprovechar todos los beneficios.` };
    case 4:
      return { completed: true, percentage: 100, title: "¡Información completada!", description: "Felicidades, has completado tu información para Impúlsate. Puedes continuar disfrutando de todos los beneficios de tu crédito." };
  }
}
