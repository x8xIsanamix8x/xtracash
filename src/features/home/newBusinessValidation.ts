import { normalizePaymentIconId } from "../mobile-payment/paymentPurpose";
import type { NewBusinessHomeData } from "./newBusinessTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMoney(value: unknown): { bs: string; usd: string } | null {
  if (!isRecord(value) || typeof value.bs !== "string" || typeof value.usd !== "string") return null;
  if (!/^\d+(?:\.\d+)?$/.test(value.bs) || !/^\d+(?:\.\d+)?$/.test(value.usd)) return null;
  return { bs: value.bs, usd: value.usd };
}

function normalizeBalanceStatus(value: unknown): NewBusinessHomeData["balance"]["status"] | null {
  if (value === "AL_DIA" || value === "ACTIVE") return "ACTIVE";
  if (value === "RETRASO" || value === "PAYMENT_DUE") return "PAYMENT_DUE";
  if (value === "MORA" || value === "SUSPENDED") return "SUSPENDED";
  return null;
}

function normalizeConsumptionStatus(value: unknown): NewBusinessHomeData["consumptions"][number]["status"] | null {
  if (value === "AL_DIA" || value === "UP_TO_DATE") return "UP_TO_DATE";
  if (value === "RETRASO" || value === "PAYMENT_DUE") return "PAYMENT_DUE";
  if (value === "MORA" || value === "OVERDUE") return "OVERDUE";
  return null;
}

export function parseNewBusinessHomeData(value: unknown): NewBusinessHomeData | null {
  if (!isRecord(value) || typeof value.fullName !== "string" || !isRecord(value.balance)) return null;
  const available = readMoney(value.balance.available);
  const totalCredit = readMoney(value.balance.totalCredit);
  const balanceStatus = normalizeBalanceStatus(value.balance.status);
  if (!available || !totalCredit || !balanceStatus || !Array.isArray(value.consumptions) || !isRecord(value.debt)) return null;
  const totalDebt = readMoney(value.debt.total);
  if (!totalDebt) return null;
  const consumptions = value.consumptions.map((item) => {
    if (!isRecord(item) || typeof item.consumptionId !== "string" || typeof item.label !== "string") return null;
    const amount = readMoney(item.amount);
    const nextAmount = item.nextPaymentAmount === null ? null : readMoney(item.nextPaymentAmount);
    const status = normalizeConsumptionStatus(item.status);
    const installments = item.installments;
    const paidInstallments = item.paidInstallments;
    if (!amount || !status || typeof installments !== "number" || typeof paidInstallments !== "number" || !Number.isInteger(installments) || !Number.isInteger(paidInstallments)) return null;
    const icon = normalizePaymentIconId(item.icon ?? item.icono) ?? "receipt";
    return { consumptionId: item.consumptionId, icon, label: item.label, amount, installments, paidInstallments, nextPaymentDate: typeof item.nextPaymentDate === "string" ? item.nextPaymentDate : null, nextPaymentAmount: nextAmount, status };
  });
  if (consumptions.some((item) => item === null)) return null;
  return { fullName: value.fullName, balance: { available, totalCredit, status: balanceStatus }, consumptions: consumptions as NonNullable<typeof consumptions[number]>[], debt: { total: totalDebt } };
}
