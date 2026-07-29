import type { CreditLineStatus } from "@/features/credit-line";

export const homeMock = {
  initialOverviewStatus: "ready",
  user: {
    firstName: "Andrés",
  },
  card: {
    lineStatus: "active" satisfies CreditLineStatus,
    available: "Bs. 12.500,00",
  },
  credit: {
    creditLimit: "Bs. 15.740,00",
    currentDebt: "Bs. 3.240,00",
    minimumPayment: "Bs. 648,00",
    dueDateLabel: "5 de agosto",
    paymentProximity: "upcoming",
    usedPercentage: 21,
    annualRate: "Por validar",
  },
  activity: [
    { id: 1, kind: "payment", title: "Pago recibido", amount: "Bs. 850,00", date: "18 de julio" },
    { id: 2, kind: "approval", title: "Crédito aprobado", amount: "Bs. 5.000,00", date: "10 de julio" },
    { id: 3, kind: "adjustment", title: "Ajuste de línea disponible", amount: "Bs. 1.200,00", date: "3 de julio" },
  ],
} as const;
