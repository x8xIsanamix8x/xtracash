import assert from "node:assert/strict";
import test from "node:test";

import { findActiveMarketplacePurchaseForProduct, isActiveMarketplacePurchase, marketplacePurchaseProductId } from "../../src/features/marketplace/purchaseAvailability.ts";

test("identifies active purchase stages; confirmed and expired purchases are inactive", () => {
  assert.equal(isActiveMarketplacePurchase({ etapa: "PAGAR_INICIAL" }), true);
  assert.equal(isActiveMarketplacePurchase({ etapa: "VALIDANDO_PAGO" }), true);
  assert.equal(isActiveMarketplacePurchase({ etapa: "ESPERANDO_FIRMAS" }), true);
  assert.equal(isActiveMarketplacePurchase({ etapa: "PAGAR_CUOTAS" }), false);
  assert.equal(isActiveMarketplacePurchase({ etapa: "VENCIDA" }), false);
  assert.equal(isActiveMarketplacePurchase(null), false);
});

test("only an active purchase for the same product is recovered as a blocker", () => {
  const purchases = [
    { id: "other", producto: { id: "product-1" }, etapa: "PAGAR_INICIAL" },
    { id: "same", producto: { id: "product-2" }, etapa: "ESPERANDO_FIRMAS" },
    { id: "confirmed", producto: { id: "product-2" }, etapa: "PAGAR_CUOTAS" },
  ];

  assert.equal(findActiveMarketplacePurchaseForProduct(purchases, "product-1")?.id, "other");
  assert.equal(findActiveMarketplacePurchaseForProduct(purchases, "product-2")?.id, "same");
  assert.equal(findActiveMarketplacePurchaseForProduct(purchases, "product-3"), null);
});

test("reads product identity from marketplace and fallback response shapes", () => {
  assert.equal(marketplacePurchaseProductId({ producto: { id: "product-1" } }), "product-1");
  assert.equal(marketplacePurchaseProductId({ productoId: "product-2" }), "product-2");
  assert.equal(marketplacePurchaseProductId({ producto: null }), null);
});
