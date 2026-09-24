import type {
  HomeMockScenario,
  NewBusinessHomeData,
} from "../newBusinessTypes";

const activeConsumptions: NewBusinessHomeData["consumptions"] = [
  {
    consumptionId: "mock-health-001",
    icon: "health",
    label: "Clínica",
    amount: { bs: "75000.00", usd: "0.00" },
    installments: 4,
    paidInstallments: 1,
    nextPaymentDate: "2026-09-30",
    nextPaymentAmount: { bs: "25000.00", usd: "0.00" },
    status: "UP_TO_DATE",
  },
  {
    consumptionId: "mock-pets-001",
    icon: "pets",
    label: "Veterinario",
    amount: { bs: "48000.00", usd: "0.00" },
    installments: 3,
    paidInstallments: 1,
    nextPaymentDate: "2026-10-05",
    nextPaymentAmount: { bs: "16000.00", usd: "0.00" },
    status: "UP_TO_DATE",
  },
  {
    consumptionId: "mock-restaurant-001",
    icon: "restaurant",
    label: "Restaurante",
    amount: { bs: "30000.00", usd: "0.00" },
    installments: 2,
    paidInstallments: 1,
    nextPaymentDate: "2026-10-08",
    nextPaymentAmount: { bs: "15000.00", usd: "0.00" },
    status: "UP_TO_DATE",
  },
];

const activeBase: NewBusinessHomeData = {
  fullName: "José Manuel",
  balance: {
    available: { bs: "347000.00", usd: "0.00" },
    totalCredit: { bs: "500000.00", usd: "0.00" },
    status: "ACTIVE",
  },
  consumptions: activeConsumptions,
  debt: { total: { bs: "153000.00", usd: "0.00" } },
};

export const newBusinessHomeMocks: Readonly<
  Record<HomeMockScenario, NewBusinessHomeData>
> = {
  newcomer: {
    fullName: "José Manuel",
    balance: {
      available: { bs: "500000.00", usd: "0.00" },
      totalCredit: { bs: "500000.00", usd: "0.00" },
      status: "ACTIVE",
    },
    consumptions: [],
    debt: { total: { bs: "0.00", usd: "0.00" } },
  },
  active: activeBase,
  paymentDue: {
    ...activeBase,
    balance: { ...activeBase.balance, status: "PAYMENT_DUE" },
    consumptions: activeConsumptions.map((consumption, index) => (
      index === 0
        ? { ...consumption, status: "PAYMENT_DUE" as const }
        : consumption
    )),
  },
  delinquent: {
    ...activeBase,
    balance: {
      ...activeBase.balance,
      available: { bs: "0.00", usd: "0.00" },
      status: "SUSPENDED",
    },
    consumptions: activeConsumptions.map((consumption, index) => (
      index === 0
        ? { ...consumption, status: "OVERDUE" as const }
        : consumption
    )),
  },
};

/** Cambiar esta constante permite revisar los estados sin integrar el endpoint. */
export const activeHomeMockScenario: HomeMockScenario = "active";
