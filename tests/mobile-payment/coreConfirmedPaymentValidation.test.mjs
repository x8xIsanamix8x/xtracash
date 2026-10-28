import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCoreConfirmedPayment,
} from "../../src/features/mobile-payment/server/coreConfirmedPaymentValidation.ts";

const documentedConfirmation = {
  operacionId: "01a053c5-8c3e-737c-a1b8-79a1a537288d",
  estado: "CONFIRMADA",
  etiqueta: "Clínica",
  referenciaBancaria: "000000792602",
  monto: { bs: "1500.0000", usd: "1.91" },
  total: { bs: "1545.0000", usd: "1.97" },
  comision: { bs: "45.0000", usd: "0.06", porcentaje: "3.00" },
  beneficiario: {
    nombre: "María Pérez",
    banco: { codigo: "0171", nombre: "Banco Activo" },
    telefono: "****4567",
  },
  resueltaEn: "2026-08-30T17:44:33.798679Z",
  mensaje: null,
};

test("acepta la respuesta documentada de confirmación", () => {
  assert.deepEqual(parseCoreConfirmedPayment(documentedConfirmation), {
    operationId: documentedConfirmation.operacionId,
    status: "CONFIRMADA",
    isPending: false,
    label: "Clínica",
    bankReference: "000000792602",
    amountBs: "1500.00",
    totalBs: "1545.00",
    feeBs: "45.00",
    feePercentage: "3.00",
    recipientBankName: "Banco Activo",
    recipient: {
      name: "María Pérez",
      bankCode: "0171",
      phone: "****4567",
    },
    resolvedAt: documentedConfirmation.resueltaEn,
    message: null,
  });
});

test("conserva el estado HTTP pendiente en el contrato normalizado", () => {
  const result = parseCoreConfirmedPayment(documentedConfirmation, true);
  assert.equal(result?.isPending, true);
});

test("rechaza la confirmación si Core omite total", () => {
  const incompatibleConfirmation = {
    ...documentedConfirmation,
  };
  delete incompatibleConfirmation.total;

  assert.equal(parseCoreConfirmedPayment(incompatibleConfirmation), null);
});

test("mantiene estricta la validación de importes y fechas", () => {
  assert.equal(parseCoreConfirmedPayment({
    ...documentedConfirmation,
    total: { bs: "1545.00000" },
  }), null);
  assert.equal(parseCoreConfirmedPayment({
    ...documentedConfirmation,
    resueltaEn: "fecha-invalida",
  }), null);
});
