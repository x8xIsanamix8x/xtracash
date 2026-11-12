export type MarketplaceInitialOption = Readonly<{
  porcentaje: string;
  inicial: Readonly<{ usdt: string | number; bs?: string | number }>;
  pagoInicial: Readonly<{ usdt: string | number; bs?: string | number }>;
  aFinanciar: Readonly<{ usdt: string | number; bs?: string | number }>;
  cuotas?: number;
  montoCuota?: Readonly<{ usdt: string | number; bs?: string | number }>;
}>;

export const MARKETPLACE_MIN_INITIAL_PERCENTAGE = 30;
export const MARKETPLACE_MAX_INITIAL_PERCENTAGE = 100;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function amount(value: unknown): value is string | number {
  return (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
    || (typeof value === "number" && Number.isFinite(value));
}

function validPercentage(value: string): boolean {
  const normalized = value.trim();
  return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)
    && Number.isFinite(Number(normalized))
    && Number(normalized) >= MARKETPLACE_MIN_INITIAL_PERCENTAGE
    && Number(normalized) <= MARKETPLACE_MAX_INITIAL_PERCENTAGE;
}

function money(value: unknown): value is MarketplaceInitialOption["inicial"] {
  return record(value) && amount(value.usdt) && (value.bs === undefined || amount(value.bs));
}

function parseOption(value: unknown): MarketplaceInitialOption | null {
  if (!record(value)) return null;
  const rawPercentage = value.porcentaje;
  if ((typeof rawPercentage !== "string" && typeof rawPercentage !== "number")
    || !validPercentage(String(rawPercentage))
    || !money(value.inicial)
    || !money(value.pagoInicial)
    || !money(value.aFinanciar)) return null;

  const cuotas = value.cuotas;
  if (cuotas !== undefined && (!Number.isInteger(cuotas) || Number(cuotas) < 0)) return null;
  if (value.montoCuota !== undefined && !money(value.montoCuota)) return null;

  return {
    porcentaje: String(rawPercentage),
    inicial: value.inicial,
    pagoInicial: value.pagoInicial,
    aFinanciar: value.aFinanciar,
    ...(typeof cuotas === "number" ? { cuotas } : {}),
    ...(money(value.montoCuota) ? { montoCuota: value.montoCuota } : {}),
  };
}

/** Parses backend-provided choices without deriving amounts or percentage steps in the client. */
export function parseMarketplaceInitialOptions(value: unknown): MarketplaceInitialOption[] | null {
  if (!Array.isArray(value)) return null;
  const eligibleOptions = value.filter((option) => {
    if (!record(option)) return true;
    const percentage = option.porcentaje;
    return (typeof percentage !== "string" && typeof percentage !== "number")
      || !Number.isFinite(Number(percentage))
      || Number(percentage) >= MARKETPLACE_MIN_INITIAL_PERCENTAGE;
  });
  const options = eligibleOptions.map(parseOption);
  if (options.some((option) => option === null)) return null;
  const percentages = new Set(options.map((option) => Number(option!.porcentaje)));
  if (percentages.size !== options.length) return null;
  return (options as MarketplaceInitialOption[]).sort((left, right) => Number(left.porcentaje) - Number(right.porcentaje));
}

/** Builds a selectable option only from a complete quote returned by Core. */
export function parseMarketplaceQuotedInitialOption(value: unknown): MarketplaceInitialOption | null {
  return record(value) ? parseOption({
    porcentaje: value.inicialPorcentaje,
    inicial: value.inicial,
    pagoInicial: value.pagoInicial,
    aFinanciar: value.aFinanciar,
    cuotas: value.cuotas,
    montoCuota: value.montoCuota,
  }) : null;
}

export function mergeMarketplaceInitialOptions(options: MarketplaceInitialOption[], quotedOption: MarketplaceInitialOption | null): MarketplaceInitialOption[] {
  if (!quotedOption) return options;
  const merged = new Map(options.map((option) => [Number(option.porcentaje), option]));
  merged.set(Number(quotedOption.porcentaje), quotedOption);
  return [...merged.values()].sort((left, right) => Number(left.porcentaje) - Number(right.porcentaje));
}

export function sameInitialPercentage(left: unknown, right: unknown): boolean {
  if ((typeof left !== "string" && typeof left !== "number")
    || (typeof right !== "string" && typeof right !== "number")) return false;
  const leftValue = String(left);
  const rightValue = String(right);
  return validPercentage(leftValue)
    && validPercentage(rightValue)
    && Number(leftValue) === Number(rightValue);
}

export function getInitialPlanReason(reason: unknown): string | null {
  switch (reason) {
    case "CUPO_INSUFICIENTE": return "El disponible vigente no cubre el monto a financiar con esta inicial.";
    case "BAJO_MINIMO": return "Esta inicial está por debajo del mínimo habilitado por la empresa.";
    case "FUERA_DE_ESCALON": return "El porcentaje ya no está entre las opciones permitidas. Actualiza la cotización.";
    default: return null;
  }
}
