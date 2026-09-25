import {
  consumptionDetail,
  coreOption,
  expect,
  paymentData,
  test,
} from "../support/app";
import type { BffMock, Page } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const detailUrl = `/installments/${clinicaId}`;
const instructionsUrl = `/installments/${clinicaId}/payment`;

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
const instructionsButton = (page: Page) => page.getByRole("link", { name: "Ver instrucciones de pago" });

test.describe("SPEC-04 · Opciones de pago y desglose", () => {
  test("por defecto la próxima cuota; las opciones solo dicen qué pagan", async ({ page, bff }) => {
    await openDetail(page, bff);
    const section = optionsSection(page);

    await expect(section.getByRole("radio", { name: /Próxima cuota/ })).toBeChecked();
    await expect(section.getByRole("radio")).toHaveCount(3);
    // Sin montos, fechas ni detalle del monto (el monto se ve en las instrucciones).
    await expect(section).not.toContainText("Bs.");
    await expect(section).not.toContainText("hasta el");
    await expect(section).not.toContainText("Ver detalle del monto");
    await expect(section).not.toContainText("Total a pagar");
    await expect(section).toContainText("Consulta el monto final antes de pagar.");
    await expect(section).not.toContainText("Tasa BCV");
    await expect(instructionsButton(page)).toHaveAttribute("href", `${instructionsUrl}?option=PROXIMA`);
  });

  test("elegir todas las pendientes cambia el destino sin volver a cotizar", async ({ page, bff }) => {
    await openDetail(page, bff);
    const section = optionsSection(page);
    const quoteCalls = bff.calls(`/api/installments/${clinicaId}/payment-data`);

    await section.getByRole("radio", { name: /Todas las pendientes/ }).check();

    await expect(instructionsButton(page)).toHaveAttribute("href", `${instructionsUrl}?option=TODAS`);
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
    await expect(section.locator("[aria-live=polite]")).toHaveText("Cuotas a pagar: 2");
    await expect(section.getByRole("button", { name: "Una cuota menos" })).toBeDisabled();

    await section.getByRole("button", { name: "Una cuota más" }).click();
    await section.getByRole("button", { name: "Una cuota más" }).click();
    await expect(section.locator("[aria-live=polite]")).toHaveText("Cuotas a pagar: 4");
    await expect(section.getByRole("button", { name: "Una cuota más" })).toBeDisabled();
    await expect(instructionsButton(page)).toHaveAttribute("href", `${instructionsUrl}?option=CUOTAS&count=4`);
  });

  test("con un solo valor posible el contador igual se ve, al lado del texto y deshabilitado", async ({ page, bff }) => {
    await openDetail(page, bff);
    const section = optionsSection(page);

    await section.getByRole("radio", { name: /Elegir cuántas cuotas/ }).check();
    await expect(section.locator("[aria-live=polite]")).toHaveText("Cuotas a pagar: 2");
    await expect(section.getByRole("button", { name: "Una cuota menos" })).toBeDisabled();
    await expect(section.getByRole("button", { name: "Una cuota más" })).toBeDisabled();

    const [label, minus] = await Promise.all([
      section.getByText("Elegir cuántas cuotas").boundingBox(),
      section.getByRole("button", { name: "Una cuota menos" }).boundingBox(),
    ]);
    expect(Math.abs(label!.y + label!.height / 2 - (minus!.y + minus!.height / 2))).toBeLessThan(6);
    expect(minus!.height).toBeLessThanOrEqual(28);
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
    await expect(instructionsButton(page)).toHaveAttribute("href", `${instructionsUrl}?option=TODAS`);
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
    await expect(page.getByRole("button", { name: "Ver instrucciones de pago" })).toBeDisabled();
    await expect(page.getByText("Ya pagué")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Pagar$/ })).toHaveCount(0);
  });

  test("la opción elegida se conserva al ir y volver de las instrucciones", async ({ page, bff }) => {
    await openDetail(page, bff);
    await optionsSection(page).getByRole("radio", { name: /Todas las pendientes/ }).check();

    await instructionsButton(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "Instrucciones de pago" })).toBeVisible();
    await page.getByRole("link", { name: "Volver al detalle" }).click();

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
