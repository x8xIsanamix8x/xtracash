export type HomeMoney = Readonly<{
  bs: string;
  usd: string;
}>;

export type HomeBalanceStatus = "ACTIVE" | "PAYMENT_DUE" | "SUSPENDED";

export type HomeConsumptionStatus =
  | "UP_TO_DATE"
  | "PAYMENT_DUE"
  | "OVERDUE";

export type HomeConsumptionIconName =
  | "health"
  | "pets"
  | "restaurant"
  | "shopping"
  | "services";

/**
 * Modelo de presentación preparado para el contrato futuro del Home.
 * USD se conserva como dato, pero esta maqueta solo presenta bolívares.
 */
export type NewBusinessHomeData = Readonly<{
  fullName: string;
  balance: Readonly<{
    available: HomeMoney;
    totalCredit: HomeMoney;
    status: HomeBalanceStatus;
  }>;
  consumptions: readonly Readonly<{
    consumptionId: string;
    icon: HomeConsumptionIconName;
    label: string;
    amount: HomeMoney;
    installments: number;
    paidInstallments: number;
    nextPaymentDate: string | null;
    nextPaymentAmount: HomeMoney | null;
    status: HomeConsumptionStatus;
  }>[];
  debt: Readonly<{
    total: HomeMoney;
  }>;
}>;

export type HomeMockScenario =
  | "newcomer"
  | "active"
  | "paymentDue"
  | "delinquent";

export type HomeStatusTone = "positive" | "attention";

export type HomeDashboardViewModel = Readonly<{
  firstName: string;
  status: Readonly<{
    label: string;
    tone: HomeStatusTone;
  }>;
  balance: Readonly<{
    available: string;
    totalCredit: string;
    primaryAction: "useAvailable" | "reportInstallment";
    primaryActionLabel: "Usar mi disponible" | "Reportar cuota" | "Reactivar";
  }>;
  notice: Readonly<{
    message: string;
    tone: "attention";
  }> | null;
  consumptions: readonly Readonly<{
    id: string;
    icon: HomeConsumptionIconName;
    label: string;
    amount: string;
    installmentProgress: string;
    progress: number;
    nextPaymentDate: string | null;
    nextPaymentAmount: string | null;
    statusLabel: string;
    tone: HomeStatusTone;
  }>[];
  debt: Readonly<{
    total: string;
    nextPaymentDate: string | null;
    nextPaymentAmount: string | null;
  }> | null;
  showReportInstallmentAction: boolean;
}>;
