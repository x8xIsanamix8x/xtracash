import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { parseCoreConsumptionDetail } = await import(
  "../../src/features/installments/server/coreContracts.ts"
);
const { createConsumptionDetailViewModel, formatLongDate } = await import(
  "../../src/features/installments/presentation.ts"
);

async function detailFrom(edit = (body) => body) {
  const body = JSON.parse(
    await readFile(new URL("./fixtures/consumo-detalle.json", import.meta.url), "utf8"),
  );
  const detail = parseCoreConsumptionDetail(edit(body));
  assert.ok(detail);
  return detail;
}

test("cabecera del consumo con los datos reales de Clínica", async () => {
  const { header, isPaid, isOverdue, hasPaymentInReview } = createConsumptionDetailViewModel(
    await detailFrom(),
  );

  assert.equal(header.label, "Clínica");
  assert.equal(header.icon, "stethoscope");
  assert.equal(header.statusLabel, "Al día");
  assert.equal(header.tone, "positive");
  assert.equal(header.installmentsSummary, "3 cuotas · cada 15 días");
  assert.equal(header.pendingCapital, "Bs. 103.116,44");
  assert.equal(isPaid, false);
  assert.equal(isOverdue, false);
  assert.equal(hasPaymentInReview, false);
});

test("cronograma tipo calendario: día, mes, número y estado", async () => {
  const { schedule } = createConsumptionDetailViewModel(await detailFrom());

  assert.deepEqual(
    schedule.map((item) => [item.day, item.month, item.numberLabel, item.status.label, item.isPayable]),
    [
      ["07", "OCT", "Cuota 01", "Próxima", true],
      ["22", "OCT", "Cuota 02", "Pendiente", true],
      ["06", "NOV", "Cuota 03", "Pendiente", true],
    ],
  );
  assert.equal(schedule[0].dueDateLabel, "Vence el 7 de octubre de 2026");
  assert.equal(
    schedule[0].accessibleLabel,
    "Cuota 01, vence el 7 de octubre de 2026, Bs. 34.372,09, Próxima",
  );
});

test("estados: pagada, vencida, en mora y en revisión", async () => {
  const viewModel = createConsumptionDetailViewModel(await detailFrom((body) => {
    body.consumption.status = "VENCIDO_CON_MORA";
    body.installments[0] = { ...body.installments[0], status: "PAGADA", isNext: false, paidOn: "2026-10-05" };
    body.installments[1] = { ...body.installments[1], status: "EN_MORA", isNext: false };
    body.installments[2] = { ...body.installments[2], status: "EN_REVISION", isNext: false };
    body.debt.nextInstallment = null;
    return body;
  }));

  assert.deepEqual(
    viewModel.schedule.map((item) => [item.status.kind, item.status.label, item.isPayable]),
    [
      ["paid", "Pagada", false],
      ["late", "En mora", true],
      ["review", "En revisión", false],
    ],
  );
  assert.match(viewModel.schedule[0].paidOnLabel, /^Pagada el 5 oct/);
  assert.equal(viewModel.header.statusLabel, "En mora");
  assert.equal(viewModel.isOverdue, true);
  assert.equal(viewModel.hasPaymentInReview, true);

  const overdue = createConsumptionDetailViewModel(await detailFrom((body) => {
    body.consumption.status = "VENCIDO_SIN_MORA";
    body.installments[0] = { ...body.installments[0], status: "VENCIDA", isNext: false };
    return body;
  }));
  assert.equal(overdue.header.statusLabel, "Cuota vencida");
  assert.equal(overdue.schedule[0].status.label, "Vencida");
});

test("consumo pagado: capital en cero y nada por pagar", async () => {
  const viewModel = createConsumptionDetailViewModel(await detailFrom((body) => {
    body.consumption.status = "PAGADO";
    body.installments = body.installments.map((item) => ({
      ...item,
      status: "PAGADA",
      isNext: false,
      paidOn: "2026-10-01",
    }));
    body.debt = { nextInstallment: null, allPending: null };
    return body;
  }));

  assert.equal(viewModel.isPaid, true);
  assert.equal(viewModel.header.statusLabel, "Pagado");
  assert.equal(viewModel.header.pendingCapital, "Bs. 0,00");
  assert.ok(viewModel.schedule.every((item) => !item.isPayable));
});

test("sin periodicidad no inventa el 'cada N días'", async () => {
  const viewModel = createConsumptionDetailViewModel(await detailFrom((body) => {
    body.consumption.everyDays = null;
    body.consumption.installments = 1;
    return body;
  }));
  assert.equal(viewModel.header.installmentsSummary, "1 cuota");
});

test("fecha larga en español", () => {
  assert.equal(formatLongDate("2026-11-06"), "6 de noviembre de 2026");
});
