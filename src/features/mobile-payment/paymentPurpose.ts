import type { PaymentIconId } from "../payment-purpose/types";

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

// Nombres que usa Core. El mapa es deducido (24/09/2026): se ajusta cuando backend
// publique su catálogo de íconos.
const legacyHomeIconIds: Readonly<Record<string, PaymentIconId>> = {
  health: "stethoscope",
  clinic: "stethoscope",
  pets: "paw-print",
  pet: "paw-print",
  restaurant: "shopping-cart",
  market: "shopping-cart",
  shopping: "shopping-bag",
  services: "receipt",
  home: "house",
  education: "school",
  transport: "car",
  work: "briefcase",
  other: "shapes",
  others: "shapes",
};

// Core agrega el sufijo `-ico` (p. ej. `stethoscope-ico`).
const coreIconSuffix = /-ico$/;

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

export function normalizePaymentIconId(value: unknown): PaymentIconId | null {
  if (isPaymentIconId(value)) return value;
  if (typeof value !== "string") return null;
  const name = value.replace(coreIconSuffix, "");
  if (isPaymentIconId(name)) return name;
  return legacyHomeIconIds[name] ?? null;
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
