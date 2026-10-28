import type { CreditLineStatus } from "./status";

export type DemoCreditLineSnapshot = Readonly<{
  status: CreditLineStatus;
  totalAvailableLabel: string;
  usableAvailableLabel: string;
  usableAvailableMinorUnits: number;
}>;

export const demoCreditLineSnapshot = {
  status: "AL_DIA",
  totalAvailableLabel: "Bs. 12.500,00",
  usableAvailableLabel: "Bs. 12.500,00",
  usableAvailableMinorUnits: 1_250_000,
} as const satisfies DemoCreditLineSnapshot;
