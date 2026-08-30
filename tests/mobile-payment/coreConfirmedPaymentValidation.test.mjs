import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCoreConfirmedPayment,
} from "../../src/features/mobile-payment/server/coreConfirmedPaymentValidation.ts";

const documentedConfirmation = {
  operacionId: "01a053c5-8c3e-737c-a1b8-79a1a537288d",
  estado: "CONFIRMADA",
  referenciaBancaria: "000000792602",
  monto: { bs: "1500.0000", usd: "1.91" },
  neto: { bs: "1455.0000", usd: "1.85" },
  resueltaEn: "2026-08-30T17:44:33.798679Z",
  mensaje: null,
};

test("acepta la respuesta documentada de confirmación con UUID v7 y neto", () => {
  assert.deepEqual(parseCoreConfirmedPayment(documentedConfirmation), {
    operationId: documentedConfirmation.operacionId,
    status: "CONFIRMADA",
    bankReference: "000000792602",
    amountBs: "1500.00",
    totalBs: "1455.00",
    resolvedAt: documentedConfirmation.resueltaEn,
    message: null,
  });
});

test("rechaza el nombre de campo incompatible total si Core omite neto", () => {
  const incompatibleConfirmation = {
    ...documentedConfirmation,
    total: { bs: "1455.0000" },
  };
  delete incompatibleConfirmation.neto;

  assert.equal(parseCoreConfirmedPayment(incompatibleConfirmation), null);
});

test("mantiene estricta la validación de importes y fechas", () => {
  assert.equal(parseCoreConfirmedPayment({
    ...documentedConfirmation,
    neto: { bs: "1455.00000" },
  }), null);
  assert.equal(parseCoreConfirmedPayment({
    ...documentedConfirmation,
    resueltaEn: "fecha-invalida",
  }), null);
});
