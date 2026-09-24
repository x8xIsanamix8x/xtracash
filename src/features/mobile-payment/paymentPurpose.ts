import type { PaymentIconId } from "./types";

export const maxPaymentConceptLength = 40;

export const paymentIconIds: readonly PaymentIconId[] = [
  "school",
  "stethoscope",
  "paw-print",
  "receipt",
  "shopping-cart",
  "car",
  "house",
  "shopping-bag",
  "briefcase",
  "shapes",
];

const paymentIconIdSet = new Set<string>(paymentIconIds);

const paymentIconLabels: Readonly<Record<PaymentIconId, string>> = {
  school: "Educación",
  stethoscope: "Salud",
  "paw-print": "Mascotas",
  receipt: "Facturas",
  "shopping-cart": "Alimentos",
  car: "Transporte",
  house: "Hogar",
  "shopping-bag": "Compras",
  briefcase: "Trabajo",
  shapes: "Otros",
};

type PaymentPurpose = Readonly<{
  concept: string;
  iconId: PaymentIconId | null;
}>;

export function isPaymentIconId(value: unknown): value is PaymentIconId {
  return typeof value === "string" && paymentIconIdSet.has(value);
}

export function getPaymentIconLabel(iconId: PaymentIconId): string {
  return paymentIconLabels[iconId];
}

export function parsePaymentPurpose(value: unknown): PaymentPurpose | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.concept !== "string"
    || candidate.concept.trim().length > maxPaymentConceptLength
    || (candidate.iconId !== null && !isPaymentIconId(candidate.iconId))
  ) {
    return null;
  }

  return {
    concept: candidate.concept.trim(),
    iconId: candidate.iconId,
  };
}
