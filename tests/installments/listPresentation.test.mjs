import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  combineInstallmentsOverview,
  parseCoreFinancings,
  parseCoreUnpaidInstallments,
} = await import("../../src/features/installments/server/coreContracts.ts");
const { createInstallmentsListItems } = await import(
  "../../src/features/installments/presentation.ts"
);

async function fixture(name) {
  return JSON.parse(
    await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
}

async function overviewFrom(mutateCuotas = (body) => body, mutateFinancings = (body) => body) {
  return combineInstallmentsOverview(
    parseCoreFinancings(mutateFinancings(await fixture("financiamientos"))),
    parseCoreUnpaidInstallments(mutateCuotas(await fixture("cuotas"))),
  );
}

test("arma las cards de Mis cuotas con los datos reales del sandbox", async () => {
  const [clinica, mercado] = createInstallmentsListItems(await overviewFrom());

  assert.equal(clinica.href, "/installments/01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3");
  assert.deepEqual(clinica.card, {
    id: "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3",
    icon: "stethoscope",
    label: "Clínica",
    amount: "Bs. 100.000,00",
    installmentProgress: "0 cuotas pagadas de 3",
    progress: 0,
    nextPaymentAmount: "Bs. 34.372,09",
    nextPaymentDate: clinica.card.nextPaymentDate,
    nextPaymentLabel: "Cuota 01",
    statusLabel: "Al día",
    tone: "positive",
  });
  assert.match(clinica.card.nextPaymentDate, /^7 oct/);
  assert.equal(mercado.card.installmentProgress, "0 cuotas pagadas de 1");
  assert.equal(mercado.card.icon, "shopping-cart");
});

test("resalta todas las próximas que vencen el mismo día más cercano", async () => {
  const items = createInstallmentsListItems(await overviewFrom());
  assert.deepEqual(items.map((item) => item.isNext), [true, true]);
});

test("resalta solo la próxima más cercana cuando no hay empate", async () => {
  const items = createInstallmentsListItems(await overviewFrom((body) => {
    body.installments[1].dueDate = "2026-10-20";
    return body;
  }));
  assert.deepEqual(items.map((item) => item.isNext), [true, false]);
});

test("el chip muestra el peor estado: mora > vencida > en revisión > al día", async () => {
  const withStatus = (status) => overviewFrom((body) => {
    body.installments[2].status = status;
    return body;
  });
  const clinicaStatus = async (status) => {
    const [clinica] = createInstallmentsListItems(await withStatus(status));
    return [clinica.card.statusLabel, clinica.card.tone];
  };

  assert.deepEqual(await clinicaStatus("EN_MORA"), ["En mora", "attention"]);
  assert.deepEqual(await clinicaStatus("VENCIDA"), ["Vencida", "attention"]);
  assert.deepEqual(await clinicaStatus("EN_REVISION"), ["En revisión", "info"]);
  assert.deepEqual(await clinicaStatus("PENDIENTE"), ["Al día", "positive"]);

  const overdueConsumption = await overviewFrom(undefined, (body) => {
    body.financiamientos[0].estado = "VENCIDO_CON_MORA";
    return body;
  });
  assert.equal(createInstallmentsListItems(overdueConsumption)[0].card.statusLabel, "En mora");
});

test("sin cuota isNext (todas vencidas) muestra la más vieja y no resalta", async () => {
  const items = createInstallmentsListItems(await overviewFrom((body) => {
    body.installments = body.installments
      .filter((item) => item.label === "Clínica")
      .map((item) => ({ ...item, status: "VENCIDA", isNext: false }));
    return body;
  }));
  assert.equal(items.length, 1);
  assert.equal(items[0].isNext, false);
  assert.equal(items[0].card.nextPaymentLabel, "Cuota 01");
});

test("cuenta las pagadas y, sin datos de financiamiento, muestra las pendientes sin barra", async () => {
  const [clinica] = createInstallmentsListItems(await overviewFrom((body) => {
    body.installments = body.installments.filter((item) => item.number !== 1 || item.label !== "Clínica");
    body.installments[1].isNext = true;
    return body;
  }, (body) => {
    body.financiamientos[0].cuotas[0].estado = "PAGADA";
    return body;
  }));
  assert.equal(clinica.card.installmentProgress, "1 cuota pagada de 3");
  assert.equal(clinica.card.progress, 33);
  assert.equal(clinica.card.nextPaymentLabel, "Cuota 02");

  const orphan = combineInstallmentsOverview([], parseCoreUnpaidInstallments(await fixture("cuotas")));
  const [orphanClinica] = createInstallmentsListItems(orphan);
  assert.equal(orphanClinica.card.installmentProgress, "3 cuotas pendientes");
  assert.equal(orphanClinica.card.progress, null);
  assert.equal(orphanClinica.card.amount, null);
});

test("lista vacía cuando el cliente está al día", () => {
  assert.deepEqual(createInstallmentsListItems({ consumptions: [] }), []);
});
