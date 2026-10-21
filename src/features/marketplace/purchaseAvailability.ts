const ACTIVE_PURCHASE_STAGES = new Set(["PAGAR_INICIAL", "VALIDANDO_PAGO", "ESPERANDO_FIRMAS"]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function isActiveMarketplacePurchase(value: unknown): boolean {
  const purchase = record(value);
  return Boolean(purchase && typeof purchase.etapa === "string" && ACTIVE_PURCHASE_STAGES.has(purchase.etapa));
}

export function marketplacePurchaseProductId(value: unknown): string | null {
  const purchase = record(value);
  const product = record(purchase?.producto);
  const id = product?.id ?? purchase?.productoId;
  return typeof id === "string" && id.trim() ? id : null;
}
