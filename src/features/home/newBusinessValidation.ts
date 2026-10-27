import { normalizePaymentIconId } from "../mobile-payment/paymentPurpose";
import type { NewBusinessHomeData } from "./newBusinessTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMoney(value: unknown): { bs: string; usd: string } | null {
  if (!isRecord(value) || typeof value.bs !== "string" || typeof value.usd !== "string") return null;
  if (!/^\d+(?:\.\d{1,4})?$/.test(value.bs) || !/^\d+(?:\.\d{1,4})?$/.test(value.usd)) return null;
  return { bs: value.bs, usd: value.usd };
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function normalizeBalanceStatus(value: unknown): NewBusinessHomeData["balance"]["status"] | null {
  if (value === "AL_DIA" || value === "ABIERTA" || value === "ACTIVE") return "ACTIVE";
  if (value === "RETRASO" || value === "PAYMENT_DUE") return "PAYMENT_DUE";
  if (value === "BLOQUEADO" || value === "BLOQUEADA" || value === "BLOCKED" || value === "MORA" || value === "CON_MORA") return "BLOCKED";
  if (value === "SUSPENDIDO" || value === "SUSPENDIDA" || value === "SUSPENDED") return "SUSPENDED";
  return null;
}

function normalizeConsumptionStatus(value: unknown): NewBusinessHomeData["consumptions"][number]["status"] | null {
  if (value === "AL_DIA" || value === "UP_TO_DATE") return "UP_TO_DATE";
  if (value === "RETRASO" || value === "PAYMENT_DUE" || value === "VENCIDO_SIN_MORA") return "PAYMENT_DUE";
  if (value === "MORA" || value === "OVERDUE" || value === "VENCIDO_CON_MORA") return "OVERDUE";
  if (value === "PAGADO" || value === "PAGADA" || value === "PAID") return "PAID";
  return null;
}

function parseOnboardingMaster(value: unknown): NewBusinessHomeData["onboardingMaster"] | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || typeof value.fasesCompletadas !== "number" || !Number.isInteger(value.fasesCompletadas) || value.fasesCompletadas < 0 || value.fasesCompletadas > 3) return null;
  return { completedPhases: value.fasesCompletadas as 0 | 1 | 2 | 3 };
}

export function parseNewBusinessHomeData(value: unknown): NewBusinessHomeData | null {
  if (!isRecord(value) || typeof value.fullName !== "string" || !isRecord(value.balance)) return null;
  const available = readMoney(value.balance.available);
  const totalCredit = readMoney(value.balance.totalCredit);
  const balanceStatus = normalizeBalanceStatus(value.balance.status);
  if (!available || !totalCredit || !balanceStatus || !Array.isArray(value.consumptions) || !isRecord(value.debt)) return null;
  const totalDebt = readMoney(value.debt.total);
  if (!totalDebt) return null;
  const onboardingMaster = parseOnboardingMaster(value.OnboardingMaster);
  if (value.OnboardingMaster !== undefined && value.OnboardingMaster !== null && onboardingMaster === null) return null;
  if (value.showMarket != null && typeof value.showMarket !== "boolean") return null;
  const consumptions = value.consumptions.map((item) => {
    if (!isRecord(item) || typeof item.consumptionId !== "string" || typeof item.label !== "string") return null;
    const amount = readMoney(item.amount);
    const nextAmount = item.nextPaymentAmount === null || item.nextPaymentAmount === undefined ? null : readMoney(item.nextPaymentAmount);
    const status = normalizeConsumptionStatus(item.status);
    const installments = item.installments;
    const paidInstallments = item.paidInstallments;
    const nextPaymentDate = item.nextPaymentDate === null || item.nextPaymentDate === undefined ? null : isCalendarDate(item.nextPaymentDate) ? item.nextPaymentDate : undefined;
    if (!amount || !status || typeof installments !== "number" || typeof paidInstallments !== "number" || !Number.isInteger(installments) || installments < 0 || !Number.isInteger(paidInstallments) || paidInstallments < 0 || paidInstallments > installments || nextPaymentDate === undefined || (item.nextPaymentAmount != null && !nextAmount)) return null;
    const icon = normalizePaymentIconId(item.icon ?? item.icono) ?? "receipt";
    return { consumptionId: item.consumptionId, icon, label: item.label.trim(), amount, installments, paidInstallments, nextPaymentDate, nextPaymentAmount: nextAmount, status };
  });
  if (consumptions.some((item) => item === null)) return null;
  return { fullName: value.fullName.trim(), balance: { available, totalCredit, status: balanceStatus }, consumptions: consumptions as NonNullable<typeof consumptions[number]>[], debt: { total: totalDebt }, onboardingMaster, showMarket: typeof value.showMarket === "boolean" ? value.showMarket : null };
}
