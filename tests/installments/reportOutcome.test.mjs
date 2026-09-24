import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const {
  createSuccessRows,
  formatReportedInstallments,
  getReportFailure,
} = await import("../../src/features/installments/reportOutcome.ts");

const noAmounts = { expectedAmountBs: null, reportedAmountBs: null };

test("MONTO_NO_CUADRA: pantalla de error con el monto esperado, reintento y soporte", () => {
  const failure = getReportFailure("amount_mismatch", {
    expectedAmountBs: "34089.72",
    reportedAmountBs: "2.00",
  });
  assert.deepEqual(failure, {
    kind: "screen",
    reason: "El monto no cubre lo que debías a la fecha del pago (Bs. 34.089,72). Comunícate con soporte.",
    canRetry: true,
    showSupport: true,
  });
  assert.equal(
    getReportFailure("amount_mismatch", noAmounts).reason,
    "El monto no cubre lo que debías a la fecha del pago. Comunícate con soporte.",
  );
});

test("reporte en revisión o sin deuda: sin reintento", () => {
  for (const type of ["report_pending", "no_debt", "not_found"]) {
    const failure = getReportFailure(type, noAmounts);
    assert.equal(failure.kind, "screen", type);
    assert.equal(failure.canRetry, false, type);
  }
});

test("red y errores del servidor: pantalla con reintento", () => {
  assert.match(getReportFailure("network", noAmounts).reason, /problema de conexión/);
  for (const type of ["network", "server", "unconfigured"]) {
    const failure = getReportFailure(type, noAmounts);
    assert.equal(failure.kind, "screen", type);
    assert.equal(failure.canRetry, true, type);
  }
});

test("errores que se corrigen en el mismo formulario", () => {
  assert.deepEqual(getReportFailure("rate_unavailable", noAmounts), {
    kind: "form",
    field: "paymentDate",
    message: "No hay tasa registrada para esa fecha. Elige otra fecha.",
  });
  assert.equal(getReportFailure("invalid_support", noAmounts).field, "receipt");
  assert.equal(getReportFailure("support_too_large", noAmounts).field, "receipt");
  assert.deepEqual(getReportFailure("invalid", noAmounts), {
    kind: "form",
    field: null,
    message: "Revisa los datos e inténtalo nuevamente.",
  });
});

test("resumen del reporte exitoso (Figma 18)", () => {
  const rows = createSuccessRows({
    consumptionLabel: "Clínica",
    installmentsLabel: formatReportedInstallments([1, 2]),
    senderBank: "0105",
    sourceBanks: [{ code: "0105", name: "Mercantil" }],
    bankReference: "000123456789",
    senderPhone: "04141234567",
    result: {
      reportId: "r1",
      amount: { bs: "68744.18", usd: "80.45" },
      reportedAmountBs: "70000.00",
      paymentDate: "2026-09-24",
      receiptAttached: false,
    },
  });

  assert.deepEqual(rows.map((row) => row.label), [
    "Producto",
    "Cuota reportada",
    "Banco",
    "Referencia",
    "Fecha",
    "Teléfono",
    "Monto reportado",
  ]);
  assert.equal(rows[1].value, "Cuotas 01 a 02");
  assert.equal(rows[2].value, "Mercantil");
  assert.match(rows[4].value, /^24 sep/);
  assert.equal(rows[5].value, "0414 123 4567");
  // Se muestra lo que el usuario dijo haber transferido.
  assert.equal(rows[6].value, "Bs. 70.000,00");
});

test("número de cuotas reportadas", () => {
  assert.equal(formatReportedInstallments([1]), "Cuota 01");
  assert.equal(formatReportedInstallments([1, 2, 3]), "Cuotas 01 a 03");
  assert.equal(formatReportedInstallments([10]), "Cuota 10");
});
