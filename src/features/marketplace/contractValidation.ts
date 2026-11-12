const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE = /^04(12|14|16|22|24|26)\d{7}$/;
const DOCUMENT = /^[VEPJGCvepjgc]-?[0-9]{1,9}$/;
const MIN_INITIAL_PERCENTAGE = 30;
const MAX_INITIAL_PERCENTAGE = 100;
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

export function isValidInitialPercentage(value: string): boolean {
  const normalized = value.trim();
  return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)
    && Number.isFinite(Number(normalized))
    && Number(normalized) >= MIN_INITIAL_PERCENTAGE
    && Number(normalized) <= MAX_INITIAL_PERCENTAGE;
}

export function hasValidInitialPercentageQuery(parameters: URLSearchParams): boolean {
  const values = parameters.getAll("inicialPorcentaje");
  return values.length <= 1 && (values.length === 0 || isValidInitialPercentage(values[0]));
}

export function isCreatePurchaseRequest(value: unknown): boolean {
  return record(value) && typeof value.productoId === "string" && UUID.test(value.productoId)
    && typeof value.pagoInicialUsdt === "number" && Number.isFinite(value.pagoInicialUsdt) && value.pagoInicialUsdt > 0;
}

export function isInitialPaymentRequest(value: unknown): boolean {
  return record(value) && ["PAGO_MOVIL", "TRANSFERENCIA"].includes(String(value.metodo))
    && typeof value.bancoOrigen === "string" && /^\d{1,4}$/.test(value.bancoOrigen)
    && typeof value.telefonoOrigen === "string" && PHONE.test(value.telefonoOrigen)
    && typeof value.referencia === "string" && value.referencia.length <= 40
    && typeof value.fechaPago === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.fechaPago)
    && typeof value.montoBs === "number" && Number.isFinite(value.montoBs) && value.montoBs > 0
    && (value.documentoPagador === undefined || (typeof value.documentoPagador === "string" && DOCUMENT.test(value.documentoPagador)));
}

function validC2pFields(value: Record<string, unknown>) {
  return typeof value.bancoOrigen === "string" && /^\d{1,4}$/.test(value.bancoOrigen)
    && typeof value.telefonoOrigen === "string" && PHONE.test(value.telefonoOrigen)
    && (value.documentoPagador === undefined || (typeof value.documentoPagador === "string" && DOCUMENT.test(value.documentoPagador)));
}

export function isC2pOtpRequest(value: unknown): boolean { return record(value) && validC2pFields(value); }
export function isC2pChargeRequest(value: unknown): boolean { return record(value) && validC2pFields(value) && typeof value.otp === "string" && /^\d{4,8}$/.test(value.otp); }
export function isSignPurchaseRequest(value: unknown): boolean { return record(value) && value.firmado === true && Object.keys(value).length === 1; }
