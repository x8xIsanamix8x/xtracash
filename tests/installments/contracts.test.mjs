import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  combineInstallmentsOverview,
  parseCoreBanks,
  parseCoreConsumptionDetail,
  parseCoreFinancings,
  parseCorePaymentData,
  parseCoreProblem,
  parseCoreReportCreated,
  parseCoreUnpaidInstallments,
} = await import("../../src/features/installments/server/coreContracts.ts");
const {
  normalizeAmount,
  parseConsumptionDetail,
  parseInstallmentReportResult,
  parseInstallmentsBffError,
  parseInstallmentsOverview,
  parsePaymentData,
} = await import("../../src/features/installments/contractValidation.ts");
const { getInstallmentsFailureResponse } = await import(
  "../../src/features/installments/server/installmentsFailure.ts"
);
const {
  parsePaymentDateQuery,
  validateCreateInstallmentReportRequest,
} = await import("../../src/features/installments/server/requestValidation.ts");

async function fixture(name) {
  return JSON.parse(
    await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
}

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const mercadoId = "01a0cb15-9730-7ab0-beef-046eda7fdd7d";
const banks = [{ code: "0105", name: "Mercantil" }, { code: "0171", name: "Banco Activo" }];
/** Lo que el BFF serializa y el navegador vuelve a validar. */
const roundTrip = (value) => JSON.parse(JSON.stringify(value));

test("normaliza montos de Core a dos decimales", () => {
  assert.equal(normalizeAmount("34372.09"), "34372.09");
  assert.equal(normalizeAmount("3353.7900"), "3353.79");
  assert.equal(normalizeAmount("12.5"), "12.50");
  assert.equal(normalizeAmount("0.005"), "0.01");
  assert.equal(normalizeAmount("99.995"), "100.00");
  assert.equal(normalizeAmount("7"), "7.00");
  assert.equal(normalizeAmount("-1.00"), null);
  assert.equal(normalizeAmount(12), null);
});

test("Mis cuotas combina /financiamientos y /cuotas en el orden del más viejo al más nuevo", async () => {
  const financings = parseCoreFinancings(await fixture("financiamientos"));
  const unpaid = parseCoreUnpaidInstallments(await fixture("cuotas"));
  assert.ok(financings);
  assert.ok(unpaid);

  const overview = combineInstallmentsOverview(financings, unpaid);
  assert.deepEqual(overview.consumptions.map((item) => item.label), ["Clínica", "Mercado"]);

  const [clinica, mercado] = overview.consumptions;
  assert.equal(clinica.consumptionId, clinicaId);
  assert.equal(clinica.icon, "stethoscope");
  assert.equal(mercado.icon, "shopping-cart");
  assert.deepEqual(clinica.amount, { bs: "100000.00", usd: "117.16" });
  assert.equal(clinica.totalInstallments, 3);
  assert.equal(clinica.paidInstallments, 0);
  assert.equal(clinica.status, "AL_DIA");
  assert.equal(clinica.consumedOn, "2026-09-22");
  assert.deepEqual(clinica.pendingInstallments.map((item) => item.number), [1, 2, 3]);
  assert.equal(clinica.pendingInstallments[0].isNext, true);
  assert.equal(mercado.pendingInstallments.length, 1);

  assert.deepEqual(parseInstallmentsOverview(roundTrip(overview)), overview);
});

test("Mis cuotas omite consumos sin cuotas pendientes y no pierde los que falten en /financiamientos", async () => {
  const financings = parseCoreFinancings(await fixture("financiamientos"));
  const cuotas = await fixture("cuotas");
  const onlyMercado = parseCoreUnpaidInstallments({
    installments: cuotas.installments.filter((item) => item.consumptionId === mercadoId),
  });
  assert.deepEqual(
    combineInstallmentsOverview(financings, onlyMercado).consumptions.map((item) => item.label),
    ["Mercado"],
  );

  const orphan = combineInstallmentsOverview([], parseCoreUnpaidInstallments(cuotas));
  assert.equal(orphan.consumptions.length, 2);
  assert.equal(orphan.consumptions[0].amount, null);
  assert.equal(orphan.consumptions[0].totalInstallments, null);
  assert.deepEqual(parseInstallmentsOverview(roundTrip(orphan)), orphan);

  assert.deepEqual(
    combineInstallmentsOverview(financings, parseCoreUnpaidInstallments({ installments: [] })),
    { consumptions: [] },
  );
});

test("cuenta como pagadas solo las cuotas PAGADA de /financiamientos", async () => {
  const body = await fixture("financiamientos");
  body.financiamientos[0].cuotas[0].estado = "PAGADA";
  body.financiamientos[0].cuotas[1].estado = "EN_REVISION";
  const [clinica] = parseCoreFinancings(body);
  assert.equal(clinica.paidInstallments, 1);
});

test("rechaza respuestas de Core incompletas o con estados desconocidos", async () => {
  const cuotas = await fixture("cuotas");
  assert.equal(parseCoreUnpaidInstallments({}), null);
  assert.equal(parseCoreUnpaidInstallments({
    installments: [{ ...cuotas.installments[0], status: "PAGADA" }],
  }), null);
  assert.equal(parseCoreUnpaidInstallments({
    installments: [{ ...cuotas.installments[0], status: "OTRO" }],
  }), null);
  assert.equal(parseCoreUnpaidInstallments({
    installments: [{ ...cuotas.installments[0], amount: { bs: "1" } }],
  }), null);

  const financings = await fixture("financiamientos");
  financings.financiamientos[0].estado = "DESCONOCIDO";
  assert.equal(parseCoreFinancings(financings), null);
});

test("acepta los estados EN_MORA, VENCIDA y EN_REVISION de /cuotas", async () => {
  const cuotas = await fixture("cuotas");
  const statuses = ["EN_MORA", "VENCIDA", "EN_REVISION", "PENDIENTE"];
  const parsed = parseCoreUnpaidInstallments({
    installments: cuotas.installments.map((item, index) => ({ ...item, status: statuses[index] })),
  });
  assert.deepEqual(parsed.map((item) => item.installment.status), statuses);
});

test("detalle del consumo: cabecera, cronograma y deuda", async () => {
  const detail = parseCoreConsumptionDetail(await fixture("consumo-detalle"));
  assert.ok(detail);
  assert.equal(detail.consumption.label, "Clínica");
  assert.equal(detail.consumption.icon, "stethoscope");
  assert.equal(detail.consumption.totalInstallments, 3);
  assert.equal(detail.consumption.everyDays, 15);
  assert.equal(detail.consumption.interestFreeDays, 15);
  assert.equal(detail.consumption.consumedOn, "2026-09-22");
  assert.deepEqual(detail.installments.map((item) => item.dueDate), [
    "2026-10-07",
    "2026-10-22",
    "2026-11-06",
  ]);
  assert.equal(detail.installments[0].paidOn, null);
  assert.equal(detail.debt.nextInstallment.total.bs, "34372.09");
  assert.equal(detail.debt.allPending.breakdown.capital.bs, "103116.44");
  assert.equal(detail.debt.allPending.interestFree, true);

  assert.deepEqual(parseConsumptionDetail(roundTrip(detail)), detail);
});

test("detalle en mora: nextInstallment nula y cuota pagada con fecha", async () => {
  const body = await fixture("consumo-detalle");
  body.consumption.status = "VENCIDO_CON_MORA";
  body.installments[0] = { ...body.installments[0], status: "PAGADA", isNext: false, paidOn: "2026-10-01" };
  body.installments[1] = { ...body.installments[1], status: "EN_MORA" };
  body.debt.nextInstallment = null;

  const detail = parseCoreConsumptionDetail(body);
  assert.ok(detail);
  assert.equal(detail.debt.nextInstallment, null);
  assert.equal(detail.installments[0].paidOn, "2026-10-01");
  assert.equal(detail.installments[1].status, "EN_MORA");
});

test("datos-pago: destino, tasa y las tres formas de pagar", async () => {
  const data = parseCorePaymentData(await fixture("datos-pago-hoy"), banks);
  assert.ok(data);
  assert.deepEqual(data.destination, {
    bank: "Banco Activo",
    bankCode: "0171",
    taxId: "J500887043",
    phone: "584142642085",
    beneficiaryName: "IMPULSA VENTURE CAPITAL C.A.",
    account: "01710002506002627254",
    accountType: "CTE",
  });
  assert.equal(data.quote.paymentDate, "2026-09-24");
  assert.deepEqual(data.quote.rate, { bolivaresPerUsd: "854.46370000", effectiveDate: "2026-09-23" });
  assert.equal(data.quote.hasDebt, true);
  assert.equal(data.quote.nextInstallment.total.bs, "34372.09");
  assert.equal(data.quote.allPending.total.bs, "103116.44");
  assert.deepEqual(data.quote.options.map((option) => option.total.bs), [
    "34372.09",
    "68744.18",
    "103116.44",
  ]);
  assert.deepEqual(data.quote.options[1].installments, [1, 2]);
  assert.deepEqual(data.sourceBanks, banks);

  assert.deepEqual(parsePaymentData(roundTrip(data)), data);
});

test("datos-pago con fecha pasada usa la tasa de ese día", async () => {
  const data = parseCorePaymentData(await fixture("datos-pago-con-fecha"), banks);
  assert.equal(data.quote.paymentDate, "2026-09-16");
  assert.equal(data.quote.options[0].total.bs, "34089.72");
});

test("datos-pago SIN_DEUDA y en mora", async () => {
  const body = await fixture("datos-pago-hoy");
  const noDebt = parseCorePaymentData({
    ...body,
    consumption: {
      ...body.consumption,
      code: "SIN_DEUDA",
      nextInstallment: null,
      allPending: null,
      options: null,
    },
  }, banks);
  assert.equal(noDebt.quote.hasDebt, false);
  assert.deepEqual(noDebt.quote.options, []);
  assert.deepEqual(parsePaymentData(roundTrip(noDebt)), noDebt);

  const overdue = parseCorePaymentData({
    ...body,
    consumption: {
      ...body.consumption,
      nextInstallment: null,
      options: [body.consumption.allPending],
    },
  }, banks);
  assert.equal(overdue.quote.nextInstallment, null);
  assert.equal(overdue.quote.options.length, 1);

  assert.equal(parseCorePaymentData({
    ...body,
    consumption: { ...body.consumption, allPending: null },
  }, banks), null);
});

test("catálogo de bancos inválido o vacío se rechaza", () => {
  assert.equal(parseCoreBanks([]), null);
  assert.equal(parseCoreBanks([{ code: "12", name: "X" }]), null);
  assert.deepEqual(parseCoreBanks(banks), banks);
});

test("reporte creado (201)", () => {
  const result = parseCoreReportCreated({
    id: "01919c10-2b4e-7a31-8d52-9e0f1a2b3c4d",
    amount: { bs: "34089.72", usd: "40.23" },
    reportedAmount: "35000.00",
    paymentDate: "2026-09-16",
    status: "PENDIENTE",
    receipt: null,
  }, true);
  assert.deepEqual(result, {
    reportId: "01919c10-2b4e-7a31-8d52-9e0f1a2b3c4d",
    amount: { bs: "34089.72", usd: "40.23" },
    reportedAmountBs: "35000.00",
    paymentDate: "2026-09-16",
    receiptAttached: false,
  });
  assert.deepEqual(parseInstallmentReportResult(roundTrip(result)), result);
});

test("MONTO_NO_CUADRA llega al navegador con el monto esperado y el reportado", async () => {
  const problem = parseCoreProblem(await fixture("reporte-monto-no-cuadra"));
  assert.deepEqual(problem, {
    code: "MONTO_NO_CUADRA",
    expectedAmountBs: "34089.72",
    reportedAmountBs: "2.00",
  });

  const response = getInstallmentsFailureResponse({ type: "http", status: 400, problem });
  assert.deepEqual(response, {
    status: 400,
    body: { error: "amount_mismatch", expectedAmountBs: "34089.72", reportedAmountBs: "2.00" },
  });
  assert.deepEqual(parseInstallmentsBffError(response.body), {
    error: "amount_mismatch",
    expectedAmountBs: "34089.72",
    reportedAmountBs: "2.00",
  });
});

test("traduce los errores de Core a errores del BFF", () => {
  const map = (status, code = null, type = "http") => getInstallmentsFailureResponse({
    type,
    status,
    problem: { code, expectedAmountBs: null, reportedAmountBs: null },
  });

  assert.deepEqual(map(400, "TASA_NO_DISPONIBLE"), { status: 400, body: { error: "rate_unavailable" } });
  assert.deepEqual(map(400, "SIN_DEUDA"), { status: 400, body: { error: "no_debt" } });
  assert.deepEqual(map(400), { status: 400, body: { error: "invalid_request" } });
  assert.deepEqual(map(403, "CONSUMO_AJENO"), { status: 404, body: { error: "consumption_not_found" } });
  assert.deepEqual(map(404), { status: 404, body: { error: "consumption_not_found" } });
  assert.deepEqual(
    map(404, "DATOS_PAGO_NO_CONFIGURADOS"),
    { status: 404, body: { error: "payment_data_unconfigured" } },
  );
  assert.deepEqual(map(409, "REPORTE_PENDIENTE"), { status: 409, body: { error: "report_pending" } });
  assert.deepEqual(map(500), { status: 502, body: { error: "upstream_error" } });
  assert.deepEqual(map(null, null, "network"), { status: 503, body: { error: "service_unavailable" } });
  assert.deepEqual(map(null, null, "protocol"), { status: 502, body: { error: "upstream_error" } });
});

const validReport = {
  option: "PROXIMA",
  amountBs: "34372.09",
  senderBank: "0105",
  senderPhone: "04141234567",
  paymentDate: "2026-09-24",
  bankReference: "000123456789",
};

test("valida el cuerpo del reporte antes de llamar a Core", () => {
  const today = "2026-09-24";
  assert.deepEqual(validateCreateInstallmentReportRequest(validReport, today), {
    ok: true,
    value: validReport,
  });

  const cuotas = validateCreateInstallmentReportRequest(
    { ...validReport, option: "CUOTAS", installmentCount: 2 },
    today,
  );
  assert.equal(cuotas.ok, true);
  assert.equal(cuotas.value.installmentCount, 2);

  const invalid = [
    { ...validReport, option: "OTRA" },
    { ...validReport, option: "CUOTAS" },
    { ...validReport, option: "CUOTAS", installmentCount: 0 },
    { ...validReport, installmentCount: 2 },
    { ...validReport, amountBs: "0.00" },
    { ...validReport, amountBs: "34372.1" },
    { ...validReport, senderBank: "105" },
    { ...validReport, senderPhone: "04991234567" },
    { ...validReport, paymentDate: "2026-09-25" },
    { ...validReport, bankReference: "123" },
    { ...validReport, bankReference: "12a456" },
  ];
  for (const body of invalid) {
    assert.deepEqual(
      validateCreateInstallmentReportRequest(body, today),
      { ok: false, error: "invalid_request" },
      JSON.stringify(body),
    );
  }

  assert.deepEqual(
    validateCreateInstallmentReportRequest(
      { ...validReport, receipt: { fileName: "x.exe", contentBase64: "AAAA" } },
      today,
    ),
    { ok: false, error: "invalid_payment_support" },
  );
});

test("la fecha de la cotización es opcional pero nunca futura", () => {
  const today = "2026-09-24";
  assert.deepEqual(parsePaymentDateQuery(null, today), { ok: true, value: null });
  assert.deepEqual(parsePaymentDateQuery("", today), { ok: true, value: null });
  assert.deepEqual(parsePaymentDateQuery("2026-09-16", today), { ok: true, value: "2026-09-16" });
  assert.deepEqual(parsePaymentDateQuery("2026-09-25", today), { ok: false });
  assert.deepEqual(parsePaymentDateQuery("2026-02-30", today), { ok: false });
});
