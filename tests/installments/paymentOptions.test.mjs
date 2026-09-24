import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { parseCorePaymentData } = await import(
  "../../src/features/installments/server/coreContracts.ts"
);
const {
  createAmountBreakdown,
  createPaymentChoices,
  formatRateNote,
  getSelectedOption,
  normalizePaymentSelection,
  paymentSelectionToQuery,
} = await import("../../src/features/installments/paymentOptions.ts");

const banks = [{ code: "0105", name: "Mercantil" }];
const zero = { bs: "0.00", usd: "0.00" };

async function coreBody() {
  return JSON.parse(
    await readFile(new URL("./fixtures/datos-pago-hoy.json", import.meta.url), "utf8"),
  );
}

function option(count, totalBs, charges = {}) {
  const installments = Array.from({ length: count }, (_, index) => index + 1);
  return {
    installmentCount: count,
    installments,
    lastDueDate: "2026-12-06",
    breakdown: {
      capital: { bs: totalBs, usd: "1.00" },
      interest: charges.interest ?? zero,
      lateFee: charges.lateFee ?? zero,
      reconnection: charges.reconnection ?? zero,
    },
    total: { bs: totalBs, usd: "1.00" },
    interestFree: !charges.interest,
  };
}

async function quoteWith(edit) {
  const body = await coreBody();
  edit(body.consumption);
  const data = parseCorePaymentData(body, banks);
  assert.ok(data, "cotización inválida");
  return data.quote;
}

test("Clínica (3 cuotas): próxima, elegir cuántas y todas, con los montos reales", async () => {
  const quote = await quoteWith(() => {});
  const choices = createPaymentChoices(quote);

  assert.deepEqual(
    choices.choices.map((choice) => [choice.kind, choice.label, choice.amount]),
    [
      ["PROXIMA", "Próxima cuota", "Bs. 34.372,09"],
      ["CUOTAS", "Elegir cuántas cuotas", "Bs. 68.744,18"],
      ["TODAS", "Todas las pendientes", "Bs. 103.116,44"],
    ],
  );
  assert.match(choices.choices[0].description, /^Cuota 01 · hasta el 7 oct/);
  assert.match(choices.choices[2].description, /^Cuota 01 a 03 · hasta el 6 nov/);
  assert.deepEqual(choices.countRange, { min: 2, max: 2 });
  assert.equal(choices.onlyAllPending, false);
  assert.deepEqual(choices.defaultSelection, { option: "PROXIMA" });
});

test("con una sola cuota pendiente no repite la misma cifra", async () => {
  const quote = await quoteWith((consumption) => {
    consumption.allPending = consumption.nextInstallment;
    consumption.options = [consumption.nextInstallment];
  });
  const choices = createPaymentChoices(quote);
  assert.deepEqual(choices.choices.map((choice) => choice.kind), ["PROXIMA"]);
  assert.equal(choices.countRange, null);
});

test("con 2 cuotas no aparece 'elegir cuántas' (sería igual a todas)", async () => {
  const quote = await quoteWith((consumption) => {
    consumption.nextInstallment = option(1, "100.00");
    consumption.allPending = option(2, "200.00");
    consumption.options = [option(1, "100.00"), option(2, "200.00")];
  });
  assert.deepEqual(createPaymentChoices(quote).choices.map((choice) => choice.kind), ["PROXIMA", "TODAS"]);
});

test("con 5 cuotas el contador va de 2 a 4", async () => {
  const quote = await quoteWith((consumption) => {
    consumption.nextInstallment = option(1, "100.00");
    consumption.allPending = option(5, "500.00");
    consumption.options = [1, 2, 3, 4, 5].map((count) => option(count, `${count}00.00`));
  });
  const choices = createPaymentChoices(quote);
  assert.deepEqual(choices.countRange, { min: 2, max: 4 });

  const selection = normalizePaymentSelection(choices, { option: "CUOTAS", installmentCount: 9 });
  assert.deepEqual(selection, { option: "CUOTAS", installmentCount: 4 });
  assert.equal(getSelectedOption(quote, selection).total.bs, "400.00");
  assert.deepEqual(
    normalizePaymentSelection(choices, { option: "CUOTAS" }),
    { option: "CUOTAS", installmentCount: 2 },
  );
});

test("en mora solo se puede pagar todo, aunque se haya elegido otra cosa", async () => {
  const quote = await quoteWith((consumption) => {
    consumption.nextInstallment = null;
    consumption.options = [consumption.allPending];
  });
  const choices = createPaymentChoices(quote);
  assert.equal(choices.onlyAllPending, true);
  assert.deepEqual(choices.choices.map((choice) => choice.kind), ["TODAS"]);
  assert.deepEqual(normalizePaymentSelection(choices, { option: "PROXIMA" }), { option: "TODAS" });
  assert.deepEqual(normalizePaymentSelection(choices, null), { option: "TODAS" });
});

test("sin deuda no hay opciones", async () => {
  const quote = await quoteWith((consumption) => {
    consumption.code = "SIN_DEUDA";
    consumption.nextInstallment = null;
    consumption.allPending = null;
    consumption.options = null;
  });
  assert.equal(createPaymentChoices(quote), null);
});

test("el desglose muestra solo los cargos que aplican", () => {
  const clean = createAmountBreakdown(option(1, "34372.09"));
  assert.deepEqual(clean.lines.map((line) => line.label), ["Capital"]);
  assert.equal(clean.interestFree, true);
  assert.equal(clean.totalBs, "34372.09");

  const withCharges = createAmountBreakdown({
    ...option(2, "70000.00", {
      interest: { bs: "343.72", usd: "0.40" },
      lateFee: { bs: "103.12", usd: "0.12" },
      reconnection: { bs: "4272.32", usd: "5.00" },
    }),
    breakdown: {
      capital: { bs: "65280.84", usd: "76.40" },
      interest: { bs: "343.72", usd: "0.40" },
      lateFee: { bs: "103.12", usd: "0.12" },
      reconnection: { bs: "4272.32", usd: "5.00" },
    },
  });
  assert.deepEqual(withCharges.lines, [
    { label: "Capital", amount: "Bs. 65.280,84" },
    { label: "Interés generado", amount: "Bs. 343,72" },
    { label: "Mora", amount: "Bs. 103,12" },
    { label: "Cargo de reactivación", amount: "Bs. 4.272,32" },
  ]);
  assert.equal(withCharges.total, "Bs. 70.000,00");
  assert.equal(withCharges.interestFree, false);
});

test("nota de la tasa y query del reporte", async () => {
  const quote = await quoteWith(() => {});
  assert.match(formatRateNote(quote), /^Tasa BCV del 23 sep.*: Bs\. 854,46 por USD$/);
  assert.equal(paymentSelectionToQuery({ option: "PROXIMA" }), "option=PROXIMA");
  assert.equal(
    paymentSelectionToQuery({ option: "CUOTAS", installmentCount: 3 }),
    "option=CUOTAS&count=3",
  );
});
