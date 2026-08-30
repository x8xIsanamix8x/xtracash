import assert from "node:assert/strict";
import test from "node:test";

import {
  formatBsAmount,
  formatDocument,
  formatPhone,
  formatRateLabel,
} from "../../src/features/mobile-payment/format.ts";

test("presenta importes, teléfono y documento sin alterar sus valores canónicos", () => {
  assert.equal(formatBsAmount("222.00"), "Bs. 222,00");
  assert.equal(formatPhone("04241678905"), "0424-1678905");
  assert.equal(formatDocument("V", "78974565"), "V-78.974.565");
});

test("mapea únicamente fuentes de tasa conocidas y no muestra enums técnicos", () => {
  assert.equal(
    formatRateLabel("36.50", "BANCO_ACTIVO"),
    "Bs. 36,50 · Banco Activo",
  );
  assert.equal(formatRateLabel("36.50", "FUENTE_NUEVA"), "Bs. 36,50");
});
