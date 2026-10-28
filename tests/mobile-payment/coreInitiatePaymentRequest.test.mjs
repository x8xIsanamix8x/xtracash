import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCoreInitiatePaymentRequest,
} from "../../src/features/mobile-payment/coreInitiatePaymentRequest.ts";

const recipient = {
  id: null,
  name: "María Pérez",
  documentType: "V",
  documentNumber: "12345678",
  bankCode: "0171",
  phone: "04141234567",
  saveToDirectory: true,
};

test("envía todos los datos únicamente cuando el beneficiario es nuevo", () => {
  assert.deepEqual(buildCoreInitiatePaymentRequest({
    amountMinorUnits: 1_665_000,
    concept: "Clínica",
    iconId: "stethoscope",
    recipient,
  }), {
    beneficiarioNuevo: {
      name: "María Pérez",
      documentType: "V",
      documentNumber: "12345678",
      bankCode: "0171",
      phone: "04141234567",
      guardarEnDirectorio: true,
    },
    montoBs: 16650,
    etiqueta: "Clínica",
    icono: "stethoscope",
  });
});

test("envía únicamente el id cuando el beneficiario está registrado", () => {
  const body = buildCoreInitiatePaymentRequest({
    amountMinorUnits: 1_665_050,
    concept: "Clínica",
    iconId: "stethoscope",
    recipient: {
      ...recipient,
      id: "01919a55-3c4d-7e5f-8a6b-7c8d9e0f1a2b",
      saveToDirectory: false,
    },
  });

  assert.deepEqual(body, {
    beneficiarioId: "01919a55-3c4d-7e5f-8a6b-7c8d9e0f1a2b",
    montoBs: 16650.5,
    etiqueta: "Clínica",
    icono: "stethoscope",
  });
  assert.equal("beneficiarioNuevo" in body, false);
});

test("omite etiqueta e icono opcionales cuando el usuario no los indicó", () => {
  assert.deepEqual(buildCoreInitiatePaymentRequest({
    amountMinorUnits: 100,
    concept: "",
    iconId: null,
    recipient,
  }), {
    beneficiarioNuevo: {
      name: "María Pérez",
      documentType: "V",
      documentNumber: "12345678",
      bankCode: "0171",
      phone: "04141234567",
      guardarEnDirectorio: true,
    },
    montoBs: 1,
  });
});
