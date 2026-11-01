export type MarketplacePurchaseStage =
  | "PAGAR_INICIAL"
  | "VENCIDA"
  | "VALIDANDO_PAGO"
  | "ESPERANDO_FIRMAS"
  | "PAGAR_CUOTAS"
  | "PAGADA";

export type MarketplacePurchase = Readonly<{
  id: string;
  etapa: string;
  estado?: string;
  consumoId?: string | null;
  producto?: Readonly<{ id?: string; version?: number; nombre?: string }> | null;
  precio?: string | number;
  inicialPorcentaje?: string | number;
  inicial?: string | number;
  pagoInicial?: Readonly<{ usdt?: string | number; bs?: string | number }> | null;
  aFinanciar?: string | number;
  cuotas?: number;
  creadaEn?: string;
  venceEn?: string;
  confirmadaEn?: string;
  motivoRechazo?: string;
  resumenCuotas?: Readonly<{
    total?: number;
    pagadas?: number;
    pendientes?: number;
    vencidas?: number;
    proximoVencimiento?: string;
    estadoDeuda?: string;
  }> | null;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalAmount(value: unknown): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return value;
  return undefined;
}

function optionalCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function parseProduct(value: unknown): MarketplacePurchase["producto"] | undefined {
  if (value === null) return null;
  if (!record(value)) return undefined;
  return {
    ...(optionalString(value.id) ? { id: optionalString(value.id) } : {}),
    ...(optionalCount(value.version) !== undefined ? { version: optionalCount(value.version) } : {}),
    ...(optionalString(value.nombre) ? { nombre: optionalString(value.nombre) } : {}),
  };
}

function parseMoneyPair(value: unknown): MarketplacePurchase["pagoInicial"] | undefined {
  if (value === null) return null;
  if (!record(value)) return undefined;
  return {
    ...(optionalAmount(value.usdt) !== undefined ? { usdt: optionalAmount(value.usdt) } : {}),
    ...(optionalAmount(value.bs) !== undefined ? { bs: optionalAmount(value.bs) } : {}),
  };
}

function parseInstallmentsSummary(value: unknown): MarketplacePurchase["resumenCuotas"] | undefined {
  if (value === null) return null;
  if (!record(value)) return undefined;
  return {
    ...(optionalCount(value.total) !== undefined ? { total: optionalCount(value.total) } : {}),
    ...(optionalCount(value.pagadas) !== undefined ? { pagadas: optionalCount(value.pagadas) } : {}),
    ...(optionalCount(value.pendientes) !== undefined ? { pendientes: optionalCount(value.pendientes) } : {}),
    ...(optionalCount(value.vencidas) !== undefined ? { vencidas: optionalCount(value.vencidas) } : {}),
    ...(optionalString(value.proximoVencimiento) ? { proximoVencimiento: optionalString(value.proximoVencimiento) } : {}),
    ...(optionalString(value.estadoDeuda) ? { estadoDeuda: optionalString(value.estadoDeuda) } : {}),
  };
}

export function parseMarketplacePurchase(value: unknown): MarketplacePurchase | null {
  if (!record(value)) return null;
  const id = optionalString(value.id);
  const stage = optionalString(value.etapa);
  if (!id || !stage) return null;

  const product = parseProduct(value.producto);
  const initialPayment = parseMoneyPair(value.pagoInicial);
  const installments = parseInstallmentsSummary(value.resumenCuotas);
  if ((value.producto !== undefined && product === undefined)
    || (value.pagoInicial !== undefined && initialPayment === undefined)
    || (value.resumenCuotas !== undefined && installments === undefined)) return null;

  const amountFields = ["precio", "inicial", "inicialPorcentaje", "aFinanciar"] as const;
  if (amountFields.some((field) => value[field] !== undefined && optionalAmount(value[field]) === undefined)) return null;
  if (value.cuotas !== undefined && optionalCount(value.cuotas) === undefined) return null;

  return {
    id,
    etapa: stage,
    ...(optionalString(value.estado) ? { estado: optionalString(value.estado) } : {}),
    ...(typeof value.consumoId === "string" || value.consumoId === null ? { consumoId: value.consumoId } : {}),
    ...(product !== undefined ? { producto: product } : {}),
    ...(optionalAmount(value.precio) !== undefined ? { precio: optionalAmount(value.precio) } : {}),
    ...(optionalAmount(value.inicialPorcentaje) !== undefined ? { inicialPorcentaje: optionalAmount(value.inicialPorcentaje) } : {}),
    ...(optionalAmount(value.inicial) !== undefined ? { inicial: optionalAmount(value.inicial) } : {}),
    ...(initialPayment !== undefined ? { pagoInicial: initialPayment } : {}),
    ...(optionalAmount(value.aFinanciar) !== undefined ? { aFinanciar: optionalAmount(value.aFinanciar) } : {}),
    ...(optionalCount(value.cuotas) !== undefined ? { cuotas: optionalCount(value.cuotas) } : {}),
    ...(optionalString(value.creadaEn) ? { creadaEn: optionalString(value.creadaEn) } : {}),
    ...(optionalString(value.venceEn) ? { venceEn: optionalString(value.venceEn) } : {}),
    ...(optionalString(value.confirmadaEn) ? { confirmadaEn: optionalString(value.confirmadaEn) } : {}),
    ...(optionalString(value.motivoRechazo) ? { motivoRechazo: optionalString(value.motivoRechazo) } : {}),
    ...(installments !== undefined ? { resumenCuotas: installments } : {}),
  };
}

export function parseMarketplacePurchaseList(value: unknown): MarketplacePurchase[] | null {
  if (!Array.isArray(value)) return null;
  const purchases = value.map(parseMarketplacePurchase);
  return purchases.some((purchase) => purchase === null) ? null : purchases as MarketplacePurchase[];
}

export function marketplacePurchaseStageLabel(stage: string): string {
  switch (stage) {
    case "PAGAR_INICIAL": return "Pago inicial pendiente";
    case "VENCIDA": return "Compra vencida";
    case "VALIDANDO_PAGO": return "Pago en revisión";
    case "ESPERANDO_FIRMAS": return "Inicial aprobada · firma pendiente";
    case "PAGAR_CUOTAS": return "Compra confirmada";
    case "PAGADA": return "Compra pagada";
    default: return "Estado actualizado";
  }
}

export function marketplacePurchaseStageMessage(stage: string): string {
  switch (stage) {
    case "PAGAR_INICIAL": return "Continúa el pago inicial de esta compra.";
    case "VENCIDA": return "Esta compra venció y no se puede retomar. Puedes explorar nuevamente el catálogo.";
    case "VALIDANDO_PAGO": return "El pago está siendo validado. Consulta el estado más tarde; no repitas el pago.";
    case "ESPERANDO_FIRMAS": return "El pago inicial fue aprobado. Revisa y firma el contrato para confirmar la compra.";
    case "PAGAR_CUOTAS": return "La compra está confirmada. Consulta el estado y el cronograma de tus cuotas.";
    case "PAGADA": return "La compra fue pagada. No se generaron cuotas para esta operación.";
    default: return "Consulta el estado más reciente de esta compra.";
  }
}

export function isConfirmedMarketplacePurchaseStage(stage: string): boolean {
  return stage === "PAGAR_CUOTAS" || stage === "PAGADA";
}

export function formatMarketplaceAmount(value: string | number | undefined, currency = "USDT"): string | null {
  if (value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `${currency} ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}

export function formatMarketplacePurchaseDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", day: "numeric", month: "short", year: "numeric" }).format(date)
    : null;
}
