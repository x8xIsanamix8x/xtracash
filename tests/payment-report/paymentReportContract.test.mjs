import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePaymentReportBffConflict,
} from "../../src/features/payment-report/contractValidation.ts";
import {
  getSubmissionFailureStep,
  pendingPaymentReportPresentation,
  runPendingPrimaryAction,
} from "../../src/features/payment-report/pendingPaymentReport.ts";
import {
  parseCorePaymentReportResponse,
} from "../../src/features/payment-report/server/corePaymentReportResponse.ts";
import {
  getPaymentReportFailureResponse,
} from "../../src/features/payment-report/server/paymentReportFailure.ts";

const validCorePayload = {
  id: "01a01802-76c6-75b2-96fe-1944dbb2cc1d",
  monto: {
    bs: "3353.7900",
    usd: "42.91",
  },
  bancoEmisor: "0105",
  telefonoEmisor: "04121234567",
  fechaPago: "2026-08-23",
  referenciaBancaria: "1234",
  estado: "PENDIENTE",
  reportadoEn: "2026-08-23T18:49:25.030Z",
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("acepta 200 con payload válido", async () => {
  assert.deepEqual(
    await parseCorePaymentReportResponse(jsonResponse(200, {
      ...validCorePayload,
      monto: { ...validCorePayload.monto, bs: "3353.79" },
    })),
    { ok: true, value: { amountBs: "3353.79" } },
  );
});

test("acepta 201 con payload válido y no lo transforma en 502", async () => {
  assert.deepEqual(
    await parseCorePaymentReportResponse(jsonResponse(201, validCorePayload)),
    { ok: true, value: { amountBs: "3353.79" } },
  );
});

test("rechaza 200 con payload inválido como error de protocolo", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(200, {
    ...validCorePayload,
    monto: { bs: 3353.79 },
  }));

  assert.deepEqual(result, { ok: false, type: "protocol" });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "protocol",
    status: null,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("rechaza 201 con payload inválido como error de protocolo", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    monto: { bs: "3353.79000" },
  }));

  assert.deepEqual(result, { ok: false, type: "protocol" });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "protocol",
    status: null,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("mantiene 202 como respuesta upstream inválida", async () => {
  const result = await parseCorePaymentReportResponse(
    jsonResponse(202, validCorePayload),
  );

  assert.deepEqual(result, { ok: false, type: "http", status: 202 });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 202,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("mantiene 204 como respuesta upstream inválida", async () => {
  const result = await parseCorePaymentReportResponse(
    new Response(null, { status: 204 }),
  );

  assert.deepEqual(result, { ok: false, type: "http", status: 204 });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 204,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("clasifica REPORTE_PENDIENTE y expone solo el código seguro", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(409, {
    detail: "contenido interno",
    instance: "/api/impulsate-movil/reportes-pago",
    status: 409,
    title: "Conflict",
    codigo: "REPORTE_PENDIENTE",
  }));

  assert.deepEqual(result, {
    ok: false,
    type: "conflict",
    conflict: "payment_report_pending",
  });
  if (result.ok || result.type !== "conflict") {
    assert.fail("Se esperaba un conflicto de reporte pendiente");
  }
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 409,
    conflict: result.conflict,
  }), {
    status: 409,
    body: { error: "payment_report_pending" },
  });
});

test("conserva un 409 no documentado como conflicto genérico", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(409, {
    status: 409,
    codigo: "OTRO_CONFLICTO",
  }));

  assert.deepEqual(result, {
    ok: false,
    type: "conflict",
    conflict: "payment_report_conflict",
  });
  if (result.ok || result.type !== "conflict") {
    assert.fail("Se esperaba un conflicto genérico");
  }
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 409,
    conflict: result.conflict,
  }), {
    status: 409,
    body: { error: "payment_report_conflict" },
  });
});

test("el cliente distingue el reporte pendiente del conflicto genérico", () => {
  assert.equal(
    parsePaymentReportBffConflict({ error: "payment_report_pending" }),
    "payment_report_pending",
  );
  assert.equal(
    parsePaymentReportBffConflict({ error: "payment_report_conflict" }),
    "payment_report_conflict",
  );
  assert.equal(parsePaymentReportBffConflict({ error: "detail-interno" }), null);
});

test("Pago en revisión es informativo, no reintentable y vuelve al inicio", () => {
  assert.equal(getSubmissionFailureStep("pending"), "pending");
  assert.notEqual(getSubmissionFailureStep("pending"), "form");
  assert.notEqual(getSubmissionFailureStep("pending"), "submitting");
  assert.deepEqual(pendingPaymentReportPresentation, {
    title: "Pago en revisión",
    message: "Ya tienes un pago en revisión. Espera a que el equipo de Impulsa lo valide antes de reportar otro.",
    primaryAction: "back_home",
    primaryActionLabel: "Volver al inicio",
    allowsRetry: false,
  });

  let backHomeCalls = 0;
  runPendingPrimaryAction(() => {
    backHomeCalls += 1;
  });
  assert.equal(backHomeCalls, 1);
});
