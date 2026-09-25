import { formatBolivars } from "../home/presentation";
import type { PaymentDestination } from "./types";

export type PaymentMethod = "mobile" | "transfer";

export type InstructionRow = Readonly<{
  key: string;
  label: string;
  /** Cómo se lee en pantalla. */
  displayValue: string;
  /** Lo que se copia: sin espacios ni separadores, listo para pegar en el banco. */
  copyValue: string;
}>;

const accountTypeLabels: Readonly<Record<string, string>> = {
  CTE: "Corriente",
  CORRIENTE: "Corriente",
  AHO: "Ahorro",
  AHORRO: "Ahorro",
};

/** `584142642085` o `04142642085` → número local de 11 dígitos, o nulo si no lo es. */
export function toLocalPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (/^58\d{10}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^0\d{10}$/.test(digits)) return digits;
  return null;
}

/** "0414 264 2085" */
export function formatPhone(value: string): string {
  const local = toLocalPhone(value);
  return local ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : value;
}

/** Cuenta de 20 dígitos en grupos de 4 para leerla. */
export function formatAccount(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 20 ? digits.replace(/(\d{4})(?=\d)/g, "$1 ") : value;
}

export function formatAccountType(value: string): string {
  return accountTypeLabels[value.trim().toUpperCase()] ?? value;
}

/** Monto como se escribe en el banco: `34372,09`. */
export function toCopyAmount(amountBs: string): string {
  return amountBs.replace(".", ",");
}

export function createInstructionRows(
  destination: PaymentDestination,
  amountBs: string,
  method: PaymentMethod,
): readonly InstructionRow[] {
  const bank: InstructionRow = {
    key: "bank",
    label: "Banco",
    displayValue: `${destination.bank} (${destination.bankCode})`,
    copyValue: destination.bankCode,
  };
  const taxId: InstructionRow = {
    key: "taxId",
    label: "RIF",
    displayValue: destination.taxId,
    copyValue: destination.taxId.replace(/[^a-z0-9]/gi, ""),
  };
  const amount: InstructionRow = {
    key: "amount",
    label: "Monto",
    displayValue: formatBolivars(amountBs),
    copyValue: toCopyAmount(amountBs),
  };

  if (method === "mobile") {
    return [
      bank,
      taxId,
      {
        key: "phone",
        label: "Teléfono",
        displayValue: formatPhone(destination.phone),
        copyValue: toLocalPhone(destination.phone) ?? destination.phone,
      },
      amount,
    ];
  }

  const rows: InstructionRow[] = [bank];
  if (destination.beneficiaryName) {
    rows.push({
      key: "beneficiary",
      label: "Titular",
      displayValue: destination.beneficiaryName,
      copyValue: destination.beneficiaryName,
    });
  }
  rows.push(taxId);
  if (destination.account) {
    rows.push({
      key: "account",
      label: "Número de cuenta",
      displayValue: formatAccount(destination.account),
      copyValue: destination.account.replace(/\D/g, ""),
    });
  }
  if (destination.accountType) {
    const type = formatAccountType(destination.accountType);
    rows.push({ key: "accountType", label: "Tipo de cuenta", displayValue: type, copyValue: type });
  }
  rows.push(amount);
  return rows;
}

/** Transferencia solo si Core mandó la cuenta. */
export function getAvailableMethods(destination: PaymentDestination): readonly PaymentMethod[] {
  return destination.account ? ["mobile", "transfer"] : ["mobile"];
}

export function createCopyAllText(rows: readonly InstructionRow[]): string {
  return rows.map((row) => `${row.label}: ${row.copyValue}`).join("\n");
}
