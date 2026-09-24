import assert from "node:assert/strict";
import test from "node:test";

import {
  getPaymentIconLabel,
  maxPaymentConceptLength,
  parsePaymentPurpose,
  paymentIconIds,
} from "../../src/features/mobile-payment/paymentPurpose.ts";

test("acepta el concepto y los identificadores estables del pool de iconos", () => {
  assert.equal(maxPaymentConceptLength, 40);
  assert.equal(paymentIconIds.includes("stethoscope"), true);
  assert.deepEqual(parsePaymentPurpose({
    concept: "  Clínica  ",
    iconId: "stethoscope",
  }), {
    concept: "Clínica",
    iconId: "stethoscope",
  });
  assert.equal(getPaymentIconLabel("stethoscope"), "Salud");
});

test("permite propósito vacío y rechaza conceptos largos o iconos ajenos", () => {
  assert.deepEqual(parsePaymentPurpose({ concept: "", iconId: null }), {
    concept: "",
    iconId: null,
  });
  assert.equal(parsePaymentPurpose({
    concept: "x".repeat(41),
    iconId: null,
  }), null);
  assert.equal(parsePaymentPurpose({
    concept: "Clínica",
    iconId: "health",
  }), null);
});
