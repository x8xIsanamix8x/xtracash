import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  combineInstallmentsOverview,
  parseCoreFinancings,
  parseCoreUnpaidInstallments,
} = await import("../../src/features/installments/server/coreContracts.ts");
const { createUpcomingInstallmentItems } = await import(
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

const clinicaPayment = "/installments/01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3/payment";

test("arma una hoja por consumo con su próxima cuota (datos reales del sandbox)", async () => {
  const [clinica, mercado] = createUpcomingInstallmentItems(await overviewFrom());

  assert.deepEqual(clinica, {
    id: "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3",
    label: "Clínica",
    icon: "stethoscope",
    numberLabel: "Cuota 01",
    day: "07",
    month: "OCT",
    dueDateLabel: "Vence el 7 de octubre de 2026",
    amount: "Bs. 34.372,09",
    status: { kind: "next", label: "Próxima" },
    href: `${clinicaPayment}?option=PROXIMA&from=list`,
  });
  assert.equal(mercado.label, "Mercado");
  assert.equal(mercado.icon, "shopping-cart");
});

test("ordena por fecha de la cuota; si empatan, del consumo más viejo al más nuevo", async () => {
  const items = createUpcomingInstallmentItems(await overviewFrom((body) => {
    body.installments[1].dueDate = "2026-10-01";
    return body;
  }));
  assert.deepEqual(items.map((item) => item.label), ["Mercado", "Clínica"]);

  const tied = createUpcomingInstallmentItems(await overviewFrom());
  assert.deepEqual(tied.map((item) => item.label), ["Clínica", "Mercado"]);
});

test("Próxima: todas las que vencen el mismo día más cercano", async () => {
  const items = createUpcomingInstallmentItems(await overviewFrom());
  assert.deepEqual(items.map((item) => item.status.label), ["Próxima", "Próxima"]);
});

test("Próxima solo la más cercana; las demás quedan Pendiente", async () => {
  const items = createUpcomingInstallmentItems(await overviewFrom((body) => {
    body.installments[1].dueDate = "2026-10-20";
    return body;
  }));
  assert.deepEqual(items.map((item) => item.status.label), ["Próxima", "Pendiente"]);
});

test("en mora lleva a pagar todo lo pendiente", async () => {
  const [clinica] = createUpcomingInstallmentItems(await overviewFrom((body) => {
    body.installments[0].status = "EN_MORA";
    body.installments[0].isNext = false;
    return body;
  }));
  assert.deepEqual(clinica.status, { kind: "late", label: "En mora" });
  assert.equal(clinica.href, `${clinicaPayment}?option=TODAS&from=list`);

  const overdueConsumption = await overviewFrom(undefined, (body) => {
    body.financiamientos[0].estado = "VENCIDO_CON_MORA";
    return body;
  });
  assert.equal(createUpcomingInstallmentItems(overdueConsumption)[0].href, `${clinicaPayment}?option=TODAS&from=list`);
});

test("vencida sin mora muestra la más vieja y paga la próxima", async () => {
  const items = createUpcomingInstallmentItems(await overviewFrom((body) => {
    body.installments = body.installments
      .filter((item) => item.label === "Clínica")
      .map((item) => ({ ...item, status: "VENCIDA", isNext: false }));
    return body;
  }));
  assert.equal(items.length, 1);
  assert.equal(items[0].numberLabel, "Cuota 01");
  assert.deepEqual(items[0].status, { kind: "overdue", label: "Vencida" });
  assert.equal(items[0].href, `${clinicaPayment}?option=PROXIMA&from=list`);
});

test("con un pago en revisión la hoja no se puede tocar", async () => {
  const [clinica] = createUpcomingInstallmentItems(await overviewFrom((body) => {
    body.installments[2].status = "EN_REVISION";
    return body;
  }));
  assert.deepEqual(clinica.status, { kind: "review", label: "En revisión" });
  assert.equal(clinica.href, null);
});

test("lista vacía cuando el cliente está al día", () => {
  assert.deepEqual(createUpcomingInstallmentItems({ consumptions: [] }), []);
});
