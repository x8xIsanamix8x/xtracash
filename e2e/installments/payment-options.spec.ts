import {
  consumptionDetail,
  coreOption,
  expect,
  installmentsOverview,
  paymentData,
  test,
} from "../support/app";
import type { BffMock, Page } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const detailUrl = `/installments/${clinicaId}`;
const reportUrl = `/installments/${clinicaId}/report`;

async function openDetail(
  page: Page,
  bff: BffMock,
  options: Readonly<{
    detail?: ReturnType<typeof consumptionDetail>;
    quote?: ReturnType<typeof paymentData>;
  }> = {},
) {
  await bff.respond(`**/api/installments/${clinicaId}`, { body: options.detail ?? consumptionDetail() });
  await bff.respond(`**/api/installments/${clinicaId}/payment-data`, { body: options.quote ?? paymentData() });
  await page.goto(detailUrl);
  await expect(page.getByRole("heading", { name: /¿Quieres adelantar\?|Paga el total pendiente/ })).toBeVisible();
}

const optionsSection = (page: Page) => page.getByRole("region", { name: /¿Quieres adelantar\?|Paga el total pendiente/ });
const reportButton = (page: Page) => page.getByRole("link", { name: "Ya pagué · Reportar pago" });

test.describe("SPEC-04 · Opciones de pago y desglose", () => {
  test("por defecto la próxima cuota, con su desglose", async ({ page, bff }) => {
    await openDetail(page, bff);
    const section = optionsSection(page);

    await expect(section.getByRole("radio", { name: /Próxima cuota/ })).toBeChecked();
    await expect(section.getByRole("radio")).toHaveCount(3);
    await expect(section).toContainText("Bs. 34.372,09");
    await expect(section).toContainText("Capital");
    await expect(section).toContainText("Total a pagar");
    await expect(section).toContainText("Sin intereses: estás dentro de los primeros 15 días.");
    await expect(section).toContainText("Consulta el monto final antes de pagar.");
    await expect(section).not.toContainText("Tasa BCV");
    await expect(reportButton(page)).toHaveAttribute("href", `${reportUrl}?option=PROXIMA`);
  });

  test("elegir todas las pendientes recalcula el total al instante", async ({ page, bff }) => {
    await openDetail(page, bff);
    const section = optionsSection(page);
    const quoteCalls = bff.calls(`/api/installments/${clinicaId}/payment-data`);

    await section.getByRole("radio", { name: /Todas las pendientes/ }).check();

    await expect(section.getByRole("definition").last()).toHaveText("Bs. 103.116,44");
    await expect(reportButton(page)).toHaveAttribute("href", `${reportUrl}?option=TODAS`);
    expect(bff.calls(`/api/installments/${clinicaId}/payment-data`)).toBe(quoteCalls);
  });

  test("elegir cuántas cuotas con el contador", async ({ page, bff }) => {
    await openDetail(page, bff, {
      quote: paymentData(({ consumption }) => {
        consumption.nextInstallment = coreOption(1, "10000.00", "2026-10-07");
        consumption.allPending = coreOption(5, "50000.00", "2026-12-06");
        consumption.options = [1, 2, 3, 4, 5].map((count) => coreOption(count, `${count}0000.00`));
      }),
    });
    const section = optionsSection(page);

    await section.getByRole("radio", { name: /Elegir cuántas cuotas/ }).check();
    await expect(section.getByText("2 cuotas", { exact: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Una cuota menos" })).toBeDisabled();

    await section.getByRole("button", { name: "Una cuota más" }).click();
    await section.getByRole("button", { name: "Una cuota más" }).click();
    await expect(section.getByText("4 cuotas", { exact: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Una cuota más" })).toBeDisabled();
    await expect(section.getByRole("definition").last()).toHaveText("Bs. 40.000,00");
    await expect(reportButton(page)).toHaveAttribute("href", `${reportUrl}?option=CUOTAS&count=4`);
  });

  test("en mora solo se puede pagar todo", async ({ page, bff }) => {
    await openDetail(page, bff, {
      detail: consumptionDetail((core) => {
        core.consumption.status = "VENCIDO_CON_MORA";
        core.installments = core.installments.map((item) => ({ ...item, status: "EN_MORA", isNext: false }));
        core.debt.nextInstallment = null;
      }),
      quote: paymentData(({ consumption }) => {
        consumption.nextInstallment = null;
        consumption.options = [consumption.allPending];
      }),
    });
    const section = optionsSection(page);

    await expect(page.getByRole("heading", { name: "Paga el total pendiente" })).toBeVisible();
    await expect(section).toContainText("Tu plazo venció: para reactivar debes pagar el total pendiente.");
    await expect(section.getByRole("radio")).toHaveCount(1);
    await expect(section.getByRole("radio", { name: /Todas las pendientes/ })).toBeChecked();
    await expect(reportButton(page)).toHaveAttribute("href", `${reportUrl}?option=TODAS`);
  });

  test("tocar una cuota por pagar vuelve a la próxima y baja a las opciones", async ({ page, bff }) => {
    await openDetail(page, bff);
    const section = optionsSection(page);
    await section.getByRole("radio", { name: /Todas las pendientes/ }).check();
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.getByRole("button", { name: /Cuota 03.*Pagar/ }).click();

    await expect(section.getByRole("radio", { name: /Próxima cuota/ })).toBeChecked();
    await expect(page.getByRole("heading", { name: "¿Quieres adelantar?" })).toBeInViewport();
  });

  test("con un pago en revisión no deja reportar otro", async ({ page, bff }) => {
    await openDetail(page, bff, {
      detail: consumptionDetail((core) => {
        core.installments[0] = { ...core.installments[0], status: "EN_REVISION", isNext: false };
        core.installments[1] = { ...core.installments[1], isNext: true };
      }),
    });

    await expect(optionsSection(page)).toContainText("Ya tienes un pago en validación para este consumo.");
    await expect(page.getByRole("button", { name: "Ya pagué · Reportar pago" })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Pagar$/ })).toHaveCount(0);
  });

  test("la opción elegida se conserva al ir y volver de la lista", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await openDetail(page, bff);
    await optionsSection(page).getByRole("radio", { name: /Todas las pendientes/ }).check();

    await page.getByRole("link", { name: "Volver a mis cuotas" }).click();
    await page.getByRole("link", { name: /Clínica/ }).click();

    await expect(optionsSection(page).getByRole("radio", { name: /Todas las pendientes/ })).toBeChecked();
  });

  test("si no se puede calcular el monto permite reintentar", async ({ page, bff }) => {
    let fail = true;
    await bff.respond(`**/api/installments/${clinicaId}`, { body: consumptionDetail() });
    await bff.respond(`**/api/installments/${clinicaId}/payment-data`, () => (
      fail ? { status: 503, body: { error: "service_unavailable" } } : { body: paymentData() }
    ));

    await page.goto(detailUrl);
    await expect(page.getByText("No pudimos calcular el monto a pagar.")).toBeVisible();

    fail = false;
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("heading", { name: "¿Quieres adelantar?" })).toBeVisible();
  });
});
