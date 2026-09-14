import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCoreCreditMovements,
} from "../../src/features/credit-movements/server/coreContractValidation.ts";

const documentedCoreResponse = {
  disponible: { bs: "100.00", usd: "1.00" },
  deuda: {
    actual: { bs: "50.00", usd: "0.50" },
    pagoMinimo: { bs: "10.00", usd: "0.10" },
    proximoCorte: "2026-09-13",
    estadoFinanciero: "AL_DIA",
  },
  historial: {
    items: [{
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      monto: { bs: "75.5", usd: "0.75" },
      montoConciliado: { bs: "75.5", usd: "0.75" },
      bancoEmisor: "Banco de Venezuela",
      telefonoEmisor: "04241234567",
      fechaPago: "2026-09-13",
      referenciaBancaria: "000000123456",
      estado: "PENDIENTE",
      reportadoEn: "2026-09-13T23:48:40.052Z",
      resueltoEn: null,
      motivoRechazo: null,
    }],
    page: 0,
    size: 20,
    total: 1,
  },
};

test("adapta el item de reporte de pago documentado por Core", () => {
  assert.deepEqual(parseCoreCreditMovements(documentedCoreResponse), {
    availableBs: "100.00",
    currentDebtBs: "50.00",
    minimumPaymentBs: "10.00",
    nextCutoffDate: "2026-09-13",
    financialStatus: "AL_DIA",
    movements: [{
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      type: "REPORTE_PAGO",
      status: "PENDIENTE",
      statusDetail: "Reporte de pago pendiente",
      amountBs: "75.50",
      occurredAt: "2026-09-13T23:48:40.052Z",
      counterparty: "Banco de Venezuela",
      rejectionReason: null,
    }],
    page: 0,
    size: 20,
    total: 1,
  });
});

test("usa fechaPago cuando Core omite reportadoEn", () => {
  const response = structuredClone(documentedCoreResponse);
  delete response.historial.items[0].reportadoEn;

  const parsed = parseCoreCreditMovements(response);
  assert.equal(parsed?.movements[0]?.occurredAt, "2026-09-13T12:00:00-04:00");
});

test("acepta el movimiento unificado de Core sin contraparte", () => {
  const response = {
    ...documentedCoreResponse,
    historial: {
      ...documentedCoreResponse.historial,
      items: [{
        id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        tipo: "CREDITO",
        estado: "APROBADO",
        estadoDetalle: "Crédito aprobado",
        monto: { bs: "100.00" },
        fecha: "2026-09-13T23:48:40.052Z",
        referencia: null,
        codigo: null,
        contraparte: null,
        motivoRechazo: null,
      }],
    },
  };

  const parsed = parseCoreCreditMovements(response);
  assert.equal(parsed?.movements[0]?.counterparty, "Crédito");
  assert.equal(parsed?.movements[0]?.type, "CREDITO");
});
