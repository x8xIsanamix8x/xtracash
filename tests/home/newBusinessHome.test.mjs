import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { activeHomeMockScenario, newBusinessHomeMocks } = await import(
  "../../src/features/home/data/newBusinessHomeMocks.ts"
);
const { homeVisualTokens } = await import(
  "../../src/features/home/homeVisualTokens.ts"
);
const { createNewBusinessHomeViewModel } = await import(
  "../../src/features/home/newBusinessViewModel.ts"
);
const { parseNewBusinessHomeData } = await import(
  "../../src/features/home/newBusinessValidation.ts"
);
const { paymentIconIds } = await import(
  "../../src/features/mobile-payment/paymentPurpose.ts"
);
const { getTimeGreeting } = await import(
  "../../src/features/home/timeGreeting.ts"
);
const projectUrl = new URL("../../", import.meta.url);

test("mantiene el escenario al día como maqueta visible sin perder USD del modelo", () => {
  assert.equal(activeHomeMockScenario, "active");
  assert.equal(newBusinessHomeMocks.active.balance.available.usd, "0.00");

  const viewModel = createNewBusinessHomeViewModel(newBusinessHomeMocks.active);
  assert.equal(viewModel.status.label, "Estás al día");
  assert.equal(viewModel.status.tone, "positive");
  assert.equal(viewModel.balance.primaryAction, "useAvailable");
  assert.equal(viewModel.balance.primaryActionLabel, "Usar mi disponible");
  assert.ok(viewModel.consumptions.length > 0);
  assert.ok(viewModel.debt);
  assert.equal(viewModel.showReportInstallmentAction, true);
});

test("el recién llegado no muestra deuda ni próxima cuota inexistente", () => {
  const viewModel = createNewBusinessHomeViewModel(newBusinessHomeMocks.newcomer);

  assert.equal(viewModel.status.label, "Crédito activo");
  assert.deepEqual(viewModel.consumptions, []);
  assert.equal(viewModel.debt, null);
  assert.equal(viewModel.showReportInstallmentAction, false);
});

test("distingue retraso y mora con mensajes textuales de atención", () => {
  const paymentDue = createNewBusinessHomeViewModel(
    newBusinessHomeMocks.paymentDue,
  );
  const delinquent = createNewBusinessHomeViewModel(
    newBusinessHomeMocks.delinquent,
  );

  assert.equal(paymentDue.status.tone, "attention");
  assert.equal(
    paymentDue.notice?.message,
    "Tienes una cuota pendiente. Repórtala para mantener tu crédito al día.",
  );
  assert.equal(delinquent.status.tone, "attention");
  assert.equal(
    delinquent.notice?.message,
    "Tu disponible está suspendido. Regulariza tus cuotas pendientes para recuperarlo.",
  );
  assert.equal(delinquent.balance.primaryAction, "reportInstallment");
  assert.equal(delinquent.balance.primaryActionLabel, "Reportar cuota");
});

test("centraliza exactamente la paleta aprobada para el Home", () => {
  assert.deepEqual(Object.values(homeVisualTokens.color), [
    "#00004B",
    "#4637F5",
    "#747474",
    "#4637F5",
    "#FF7800",
    "#0AED81",
    "#61FF17",
    "#BEB8FF",
    "#C1BCFF",
    "#F0EFFF",
    "#F2F2F2",
    "#747474",
    "#7E7E7E",
    "#FFFFFF",
    "#000000",
  ]);
});

test("varía el saludo con la hora local del dispositivo", () => {
  assert.equal(getTimeGreeting(5), "Buenos días");
  assert.equal(getTimeGreeting(12), "Buenas tardes");
  assert.equal(getTimeGreeting(19), "Buenas noches");
});

test("conserva en el Home todos los iconos elegibles de Pago Móvil", () => {
  const source = {
    ...newBusinessHomeMocks.newcomer,
    consumptions: paymentIconIds.map((icon, index) => ({
      consumptionId: `payment-${index}`,
      icon,
      label: `Consumo ${index}`,
      amount: { bs: "100.00", usd: "0.00" },
      installments: 2,
      paidInstallments: 0,
      nextPaymentDate: null,
      nextPaymentAmount: null,
      status: "UP_TO_DATE",
    })),
  };

  const parsed = parseNewBusinessHomeData(source);

  assert.deepEqual(parsed?.consumptions.map(({ icon }) => icon), paymentIconIds);
});

test("normaliza los iconos históricos sin ocultar el icono recibido por Home", () => {
  const source = {
    ...newBusinessHomeMocks.newcomer,
    consumptions: [{
      consumptionId: "legacy-health",
      icon: "health",
      label: "Clínica",
      amount: { bs: "100.00", usd: "0.00" },
      installments: 2,
      paidInstallments: 0,
      nextPaymentDate: null,
      nextPaymentAmount: null,
      status: "UP_TO_DATE",
    }],
  };

  assert.equal(parseNewBusinessHomeData(source)?.consumptions[0].icon, "stethoscope");
});

test("mantiene iconos seguros, rutas existentes y flujo visual de reporte", async () => {
  const [dashboard, consumptionCard, home, navigation, details, review] = await Promise.all([
    readFile(
      new URL(
        "src/features/home/components/NewBusinessHomeDashboard.tsx",
        projectUrl,
      ),
      "utf8",
    ),
    readFile(
      new URL("src/features/home/components/ConsumptionCard.tsx", projectUrl),
      "utf8",
    ),
    readFile(new URL("src/features/home/HomeView.tsx", projectUrl), "utf8"),
    readFile(
      new URL("src/components/AppBottomNavigation.tsx", projectUrl),
      "utf8",
    ),
    readFile(
      new URL(
        "src/features/mobile-payment/components/RecipientDetailsStep.tsx",
        projectUrl,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "src/features/mobile-payment/components/ReviewStep.tsx",
        projectUrl,
      ),
      "utf8",
    ),
  ]);

  assert.match(dashboard, /<ConsumptionCard /);
  assert.match(consumptionCard, /PaymentPurposeIcon/);
  assert.match(dashboard, /PrimaryFinancialCard/);
  assert.match(details, /PrimaryFinancialCard/);
  assert.match(review, /PrimaryFinancialCard/);
  assert.match(dashboard, /href="\/mobile-payment"/);
  assert.match(dashboard, /href="\/movements"/);
  assert.match(home, /PaymentReportFlow/);
  assert.doesNotMatch(home, /createNewBusinessHomeViewModel\(summary/);
  assert.match(navigation, /label: "Movimientos"/);
  assert.match(navigation, /label: "Cuotas"/);
  assert.match(navigation, /\/navigation\/home\.svg/);
  assert.match(navigation, /\/navigation\/cuotas\.svg/);
  assert.match(navigation, /\/navigation\/movements\.svg/);
  assert.match(navigation, /\/navigation\/profile\.svg/);
  assert.match(navigation, /height=\{48\}/);
  assert.match(navigation, /width=\{48\}/);
  assert.match(navigation, /position: "fixed"/);
  assert.match(navigation, /right: 0/);
  assert.match(navigation, /left: 0/);
  assert.match(navigation, /bottom: 0/);
});
