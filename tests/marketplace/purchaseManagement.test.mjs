import assert from "node:assert/strict";
import test from "node:test";

import {
  formatMarketplaceAmount,
  isConfirmedMarketplacePurchaseStage,
  marketplacePurchaseStageLabel,
  marketplacePurchaseStageMessage,
  parseMarketplacePurchase,
  parseMarketplacePurchaseList,
} from "../../src/features/marketplace/purchaseManagement.ts";

const validPurchase = {
  id: "purchase-1",
  etapa: "PAGAR_CUOTAS",
  consumoId: "consumption-1",
  producto: { id: "product-1", nombre: "Panel solar" },
  precio: "400.00",
  pagoInicial: { usdt: "90.00", bs: "21038.35" },
  resumenCuotas: { total: 6, pagadas: 2, pendientes: 3, vencidas: 1, estadoDeuda: "VENCIDA" },
};

test("parses purchase snapshots and safely omits optional malformed values", () => {
  assert.deepEqual(parseMarketplacePurchase(validPurchase), validPurchase);
  assert.deepEqual(parseMarketplacePurchaseList([validPurchase]), [validPurchase]);
  assert.equal(parseMarketplacePurchase({ id: "purchase-1", etapa: "PAGADA", precio: "no-es-monto" }), null);
  assert.equal(parseMarketplacePurchaseList([validPurchase, null]), null);
});

test("labels purchase states without implying approval for review", () => {
  assert.equal(marketplacePurchaseStageLabel("VALIDANDO_PAGO"), "Pago en revisión");
  assert.match(marketplacePurchaseStageMessage("VALIDANDO_PAGO"), /no repitas el pago/i);
  assert.match(marketplacePurchaseStageMessage("PAGADA"), /no se generaron cuotas/i);
});

test("treats financed and fully-paid purchases as confirmed, but not pending signatures", () => {
  assert.equal(isConfirmedMarketplacePurchaseStage("PAGAR_CUOTAS"), true);
  assert.equal(isConfirmedMarketplacePurchaseStage("PAGADA"), true);
  assert.equal(isConfirmedMarketplacePurchaseStage("ESPERANDO_FIRMAS"), false);
  assert.equal(isConfirmedMarketplacePurchaseStage("VALIDANDO_PAGO"), false);
});

test("formats backend decimal amounts for Venezuelan users", () => {
  assert.equal(formatMarketplaceAmount("17590.76", "Bs."), "Bs. 17.590,76");
  assert.equal(formatMarketplaceAmount("invalid"), null);
});
