import assert from "node:assert/strict";
import test from "node:test";

import { isActiveMarketplacePurchase, marketplacePurchaseProductId } from "../../src/features/marketplace/purchaseAvailability.ts";

test("only unresolved purchase stages block starting another purchase", () => {
  assert.equal(isActiveMarketplacePurchase({ etapa: "PAGAR_INICIAL" }), true);
  assert.equal(isActiveMarketplacePurchase({ etapa: "VALIDANDO_PAGO" }), true);
  assert.equal(isActiveMarketplacePurchase({ etapa: "ESPERANDO_FIRMAS" }), true);
  assert.equal(isActiveMarketplacePurchase({ etapa: "PAGAR_CUOTAS" }), false);
  assert.equal(isActiveMarketplacePurchase({ etapa: "VENCIDA" }), false);
  assert.equal(isActiveMarketplacePurchase(null), false);
});

test("reads product identity from marketplace and fallback response shapes", () => {
  assert.equal(marketplacePurchaseProductId({ producto: { id: "product-1" } }), "product-1");
  assert.equal(marketplacePurchaseProductId({ productoId: "product-2" }), "product-2");
  assert.equal(marketplacePurchaseProductId({ producto: null }), null);
});
