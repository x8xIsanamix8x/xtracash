import type { PaymentDestination, SourceBank } from "../installments/types";

export type MarketplacePaymentMethod = "mobile" | "transfer" | "c2p";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Validates the open Swagger response before rendering destination instructions. */
export function parsePurchaseDestination(value: unknown): PaymentDestination | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  // CompraMarketplace documenta `pagarA` en español. Algunas respuestas Core
  // reutilizan el DTO PaymentDataResponse, cuyos campos equivalentes están en inglés.
  const bank = text(raw.banco) ?? text(raw.bank);
  const bankCode = text(raw.codigoBanco) ?? text(raw.codigo) ?? text(raw.bankCode) ?? bank;
  if (!bank || !bankCode) return null;

  return {
    bank,
    bankCode,
    taxId: text(raw.documento) ?? text(raw.taxId) ?? "",
    phone: text(raw.telefono) ?? text(raw.phone) ?? "",
    beneficiaryName: text(raw.nombre) ?? text(raw.beneficiaryName),
    account: text(raw.cuenta) ?? text(raw.account),
    accountType: text(raw.tipoCuenta) ?? text(raw.accountType),
  };
}

export function hasInitialPaymentDestination(
  destination: PaymentDestination | null,
  method: Exclude<MarketplacePaymentMethod, "c2p">,
): boolean {
  if (!destination?.bank || !destination.bankCode || !destination.taxId) return false;
  return method === "mobile" ? Boolean(destination.phone) : Boolean(destination.account);
}

/** Los tres medios forman parte del flujo; que falten instrucciones no debe ocultar el método. */
export function getMarketplacePaymentMethods(): readonly MarketplacePaymentMethod[] {
  return ["mobile", "transfer", "c2p"];
}

export function isValidC2pOtp(value: string): boolean {
  return /^\d{4,8}$/.test(value);
}

export function parseC2pOtpResponse(value: unknown): { otp: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.solicitada !== true || (raw.otp !== undefined && typeof raw.otp !== "string")) return null;
  const otp = typeof raw.otp === "string" ? raw.otp : "";
  return otp === "" || isValidC2pOtp(otp) ? { otp } : null;
}

export function isValidInitialPayment(value: Readonly<{
  method: MarketplacePaymentMethod;
  bank: string;
  phone: string;
  documentId: string;
  reference: string;
  date: string;
  amountBs: string;
  destination: PaymentDestination | null;
  sourceBanks: readonly SourceBank[];
  paymentEnabled: boolean;
}>): boolean {
  const bankValid = value.sourceBanks.some((bank) => bank.code === value.bank);
  const phoneValid = /^04(12|14|16|22|24|26)\d{7}$/.test(value.phone.replace(/\D/g, ""));
  const documentValid = !value.documentId || /^[VEPJGCvepjgc]-?[0-9]{1,9}$/.test(value.documentId.trim());
  const referenceValid = /^\d{4,20}$/.test(value.reference.trim());
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.date);
  const date = dateParts ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))) : null;
  const calendarDateValid = Boolean(date && date.getUTCFullYear() === Number(dateParts?.[1])
    && date.getUTCMonth() + 1 === Number(dateParts?.[2]) && date.getUTCDate() === Number(dateParts?.[3]));
  const dateValid = calendarDateValid && value.date <= today;
  const amountValid = /^\d+(?:\.\d{1,2})?$/.test(value.amountBs) && Number(value.amountBs) > 0;
  const methodValid = value.method === "mobile" ? Boolean(value.destination?.bank && value.destination.taxId && value.destination.phone)
    : value.method === "transfer" ? Boolean(value.destination?.bank && value.destination.account)
      : false;
  return value.paymentEnabled && bankValid && phoneValid && documentValid && referenceValid
    && dateValid && amountValid && methodValid;
}
