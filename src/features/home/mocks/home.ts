import type { CreditLineStatus } from "@/features/credit-line";

import type { FinancingSummary, RecentActivityItem } from "../types";

const baseFinancing = {
  assignedLimit: "Bs. 15.740,00",
  totalAvailable: "Bs. 12.500,00",
  currentDebt: "Bs. 3.240,00",
  minimumPayment: "Bs. 648,00",
  nextCutDate: "5 de agosto",
} as const;

export const financingScenarioMocks = {
  ACTIVA: {
    ...baseFinancing,
    status: "ACTIVA",
    usableAvailable: "Bs. 12.500,00",
    frozenAmount: null,
  },
  MORA_NIVEL_1: {
    ...baseFinancing,
    status: "MORA_NIVEL_1",
    usableAvailable: "Bs. 12.500,00",
    frozenAmount: null,
  },
  CONGELADA_NIVEL_2: {
    ...baseFinancing,
    status: "CONGELADA_NIVEL_2",
    usableAvailable: "Bs. 9.375,00",
    frozenAmount: "Bs. 3.125,00",
  },
  BLOQUEADA_TERCER_CORTE: {
    ...baseFinancing,
    status: "BLOQUEADA_TERCER_CORTE",
    usableAvailable: "Bs. 12.500,00",
    frozenAmount: null,
  },
  BLOQUEADA_RETIRO: {
    ...baseFinancing,
    status: "BLOQUEADA_RETIRO",
    usableAvailable: "Bs. 12.500,00",
    frozenAmount: null,
  },
} satisfies Record<CreditLineStatus, FinancingSummary>;

const recentActivity = [
  {
    id: 1,
    kind: "payment",
    title: "Pago recibido",
    amount: "Bs. 850,00",
    date: "18 de julio",
  },
  {
    id: 2,
    kind: "approval",
    title: "Crédito aprobado",
    amount: "Bs. 5.000,00",
    date: "10 de julio",
  },
  {
    id: 3,
    kind: "adjustment",
    title: "Ajuste de línea disponible",
    amount: "Bs. 1.200,00",
    date: "3 de julio",
  },
] satisfies readonly RecentActivityItem[];

export const homeMock = {
  initialOverviewStatus: "ready",
  initialFinancingStatus: "ACTIVA" satisfies CreditLineStatus,
  user: {
    firstName: "Andrés",
  },
  recentActivity,
} as const;
