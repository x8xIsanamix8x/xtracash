export type CreditMovementType = "CREDITO" | "REPORTE_PAGO";

export type CreditMovementStatus = "PENDIENTE" | "APROBADO" | "RECHAZADO";

export type CreditMovement = Readonly<{
  id: string;
  type: CreditMovementType;
  status: CreditMovementStatus;
  statusDetail: string;
  amountBs: string;
  occurredAt: string;
  counterparty: string;
  rejectionReason: string | null;
}>;

export type CreditMovementsPage = Readonly<{
  availableBs: string;
  currentDebtBs: string;
  minimumPaymentBs: string;
  nextCutoffDate: string | null;
  financialStatus: string;
  movements: readonly CreditMovement[];
  page: number;
  size: number;
  total: number;
}>;

export type CreditMovementTypeFilter = "all" | CreditMovementType;
export type CreditMovementStatusFilter = "all" | CreditMovementStatus;

export type CreditMovementFilters = Readonly<{
  type: CreditMovementTypeFilter;
  status: CreditMovementStatusFilter;
}>;

export type CreditMovementQuery = Readonly<{
  type?: CreditMovementType;
  status?: CreditMovementStatus;
  from?: string;
  to?: string;
  page: number;
  size: number;
}>;

export type CreditMovementItem = CreditMovement & Readonly<{
  displayTitle: string;
  description: string;
  statusLabel: string;
  amount: string;
  displayDate: string;
}>;

export type CreditMovementDayGroup = Readonly<{
  date: string;
  label: string;
  items: readonly CreditMovementItem[];
}>;

export type CreditMovementMonthGroup = Readonly<{
  month: string;
  label: string;
  days: readonly CreditMovementDayGroup[];
}>;
