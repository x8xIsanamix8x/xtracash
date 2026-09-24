import assert from "node:assert/strict";
import test from "node:test";

import {
  parseInitiatedPayment,
} from "../../src/features/mobile-payment/contractValidation.ts";
import {
  parseCoreInitiatedPayment,
} from "../../src/features/mobile-payment/server/coreInitiatedPaymentValidation.ts";

const requestRecipient = {
  id: null,
  name: "María Pérez",
  documentType: "V",
  documentNumber: "12345678",
  bankCode: "0171",
  phone: "04141234567",
  saveToDirectory: true,
};

const documentedResponse = {
  operacionId: "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e71",
  estado: "INICIADA",
  canal: "MISMO_BANCO",
  monto: { bs: "16650.00", usd: "450.00" },
  comision: { bs: "499.50", usd: "13.50", porcentaje: "3.00" },
  total: { bs: "16650.00", usd: "450.00" },
  tasa: { valor: "37.00", fecha: "2026-09-24", fuente: "BCV" },
  expiraEn: "2026-09-24T01:21:33.862Z",
  data: {
    etiqueta: "Clínica",
    beneficiario: {
      nombre: "María Pérez",
      banco: { codigo: "0171", nombre: "Banco Activo" },
      telefono: "04141234567",
      nacionalidad: "V",
      documento: "12345678",
    },
    monto: "16650.00",
    disponible: { bs: "16650.00", usd: "450.00" },
    financiamiento: {
      nivel: 3,
      numeroCuotas: 4,
      deuda: { bs: "16650.00", usd: "450.00" },
      pagosCadaDias: 15,
      plazoTotalDias: 60,
      diasSinInteres: 15,
      interesMensual: "1.00",
      interesDiario: "0.0333",
      interesAnual: "12.00",
      moraMensual: "3.00",
      moraDiaria: "0.1000",
      comisionReconexion: { bs: "16650.00", usd: "450.00" },
      cuotas: [{
        numero: 1,
        vencimiento: "2026-09-30",
        monto: { bs: "16650.00", usd: "450.00" },
      }],
    },
  },
};

test("normaliza toda la respuesta iniciada para la pantalla de confirmación", () => {
  const result = parseCoreInitiatedPayment(
    documentedResponse,
    requestRecipient,
    "stethoscope",
  );

  assert.deepEqual(result, {
    operationId: documentedResponse.operacionId,
    status: "INICIADA",
    channel: "MISMO_BANCO",
    amountBs: "16650.00",
    feeBs: "499.50",
    feePercentage: "3.00",
    totalBs: "16650.00",
    rateValue: "37.00",
    rateDate: "2026-09-24",
    rateSource: "BCV",
    expiresAt: "2026-09-24T01:21:33.862Z",
    availableBs: "16650.00",
    label: "Clínica",
    iconId: "stethoscope",
    recipientBankName: "Banco Activo",
    financing: {
      level: 3,
      installmentCount: 4,
      debtBs: "16650.00",
      paymentEveryDays: 15,
      totalTermDays: 60,
      interestFreeDays: 15,
      monthlyInterestRate: "1.00",
      dailyInterestRate: "0.0333",
      annualInterestRate: "12.00",
      monthlyLateFeeRate: "3.00",
      dailyLateFeeRate: "0.1000",
      reconnectionFeeBs: "16650.00",
      installments: [{
        number: 1,
        dueDate: "2026-09-30",
        amountBs: "16650.00",
      }],
    },
    recipient: requestRecipient,
  });
});

test("acepta la precisión real de la tasa y expiraciones con nanosegundos", () => {
  const result = parseCoreInitiatedPayment({
    ...documentedResponse,
    canal: "OTRA_ENTIDAD",
    tasa: {
      valor: "853.49930000",
      fecha: "2026-09-22",
      fuente: "BANCO_ACTIVO",
    },
    expiraEn: "2026-09-24T02:51:55.122955738Z",
  }, requestRecipient, "paw-print");

  assert.notEqual(result, null);
  assert.equal(result.rateValue, "853.49930000");
  assert.equal(result.expiresAt, "2026-09-24T02:51:55.122955738Z");
  assert.equal(result.channel, "OTRA_ENTIDAD");
});

test("rechaza respuestas incompletas o inconsistentes y evita confirmar", () => {
  assert.equal(parseCoreInitiatedPayment({
    ...documentedResponse,
    data: { ...documentedResponse.data, financiamiento: undefined },
  }, requestRecipient, "stethoscope"), null);

  assert.equal(parseCoreInitiatedPayment({
    ...documentedResponse,
    data: { ...documentedResponse.data, monto: "100.00" },
  }, requestRecipient, "stethoscope"), null);

  assert.equal(parseCoreInitiatedPayment({
    ...documentedResponse,
    data: {
      ...documentedResponse.data,
      financiamiento: {
        ...documentedResponse.data.financiamiento,
        cuotas: [
          documentedResponse.data.financiamiento.cuotas[0],
          documentedResponse.data.financiamiento.cuotas[0],
        ],
      },
    },
  }, requestRecipient, "stethoscope"), null);
});

test("el cliente acepta el DTO completo y rechaza planes inválidos", () => {
  const normalized = parseCoreInitiatedPayment(
    documentedResponse,
    requestRecipient,
    "stethoscope",
  );

  assert.notEqual(normalized, null);
  assert.deepEqual(parseInitiatedPayment(normalized), normalized);
  assert.equal(parseInitiatedPayment({
    ...normalized,
    financing: {
      ...normalized.financing,
      installments: [{
        number: 1,
        dueDate: "2026-02-30",
        amountBs: "16650.00",
      }],
    },
  }), null);
  assert.equal(parseInitiatedPayment({
    ...normalized,
    iconId: "health",
  }), null);
});
