import type { SourceBank } from "../types";

export const impulsaPaymentDestination = {
  bank: {
    name: "Banco Activo",
    code: "0171",
    displayValue: "Banco Activo — 0171",
  },
  rif: {
    displayValue: "J-50088704-3",
    copyValue: "J500887043",
  },
  phone: {
    displayValue: "0414-2642085",
    copyValue: "04142642085",
  },
} as const;

// Fuente temporal y aislada. Debe sustituirse durante la integración del reporte.
export const temporarySourceBanks = [
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0105", name: "Mercantil Banco" },
  { code: "0108", name: "Banco Provincial" },
  { code: "0134", name: "Banesco" },
  { code: "0171", name: "Banco Activo" },
  { code: "0191", name: "Banco Nacional de Crédito" },
] as const satisfies readonly SourceBank[];

export const paymentReportSimulationDelayMs = 800;
