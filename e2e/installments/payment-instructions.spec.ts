import { consumptionDetail, expect, paymentData, test } from "../support/app";
import type { BffMock, Page } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const detailUrl = `/installments/${clinicaId}`;
const instructionsUrl = `/installments/${clinicaId}/payment`;

async function mockConsumption(
  bff: BffMock,
  options: Readonly<{
    detail?: ReturnType<typeof consumptionDetail>;
    quote?: ReturnType<typeof paymentData>;
  }> = {},
) {
  await bff.respond(`**/api/installments/${clinicaId}`, { body: options.detail ?? consumptionDetail() });
  await bff.respond(`**/api/installments/${clinicaId}/payment-data`, { body: options.quote ?? paymentData() });
}

const amountCard = (page: Page) => page.getByRole("region", { name: "Monto a pagar" });
const details = (page: Page) => page.getByRole("region", { name: "Datos para pagar" });

test.describe("SPEC-05 · Instrucciones de pago", () => {
  test("desde el detalle muestra el monto de la opción elegida y los datos de pago móvil", async ({ page, bff }) => {
    await mockConsumption(bff);
    await page.goto(detailUrl);
    await page.getByRole("radio", { name: /Todas las pendientes/ }).check();
    await page.getByRole("link", { name: "Ver instrucciones de pago" }).click();

    await expect(page).toHaveURL(new RegExp(`${instructionsUrl}\\?option=TODAS$`));
    await expect(page.getByRole("heading", { level: 1, name: "Instrucciones de pago" })).toBeVisible();
    await expect(amountCard(page)).toContainText("Bs. 103.116,44");
    await expect(amountCard(page)).toContainText("Clínica · Cuota 01 a 03");

    const rows = details(page).getByRole("definition");
    await expect(rows).toHaveText([
      "Banco Activo (0171)",
      "J500887043",
      "0414 264 2085",
      "Bs. 103.116,44",
    ]);
    // Viene de la caché: no se volvió a cotizar.
    expect(bff.calls(`/api/installments/${clinicaId}/payment-data`)).toBe(1);
  });

  test("transferencia muestra titular, cuenta y tipo", async ({ page, bff }) => {
    await mockConsumption(bff);
    await page.goto(`${instructionsUrl}?option=PROXIMA`);

    await details(page).getByRole("button", { name: "Transferencia" }).click();
    await expect(details(page).getByRole("definition")).toHaveText([
      "Banco Activo (0171)",
      "IMPULSA VENTURE CAPITAL C.A.",
      "J500887043",
      "0171 0002 5060 0262 7254",
      "Corriente",
      "Bs. 34.372,09",
    ]);
  });

  test("copia cada dato listo para pegar en el banco", async ({ page, bff, context, baseURL }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
    await mockConsumption(bff);
    await page.goto(`${instructionsUrl}?option=PROXIMA`);

    await details(page).getByRole("button", { name: "Copiar teléfono" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Teléfono copiado" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("04142642085");

    await details(page).getByRole("button", { name: "Copiar todos los datos" }).click();
    // Windows devuelve los saltos de línea del portapapeles como \r\n.
    const copiedAll = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedAll.replace(/\r\n/g, "\n")).toBe(
      "Banco: 0171\nRIF: J500887043\nTeléfono: 04142642085\nMonto: 34372,09",
    );
  });

  test("'Ya pagué' lleva al reporte con la misma opción", async ({ page, bff }) => {
    await mockConsumption(bff);
    await page.goto(`${instructionsUrl}?option=CUOTAS&count=2`);

    await expect(amountCard(page)).toContainText("Bs. 68.744,18");
    await expect(page.getByRole("link", { name: "Ya pagué · Reportar pago" })).toHaveAttribute(
      "href",
      `/installments/${clinicaId}/report?option=CUOTAS&count=2`,
    );
    await page.getByRole("link", { name: "Volver al detalle" }).first().click();
    await expect(page).toHaveURL(new RegExp(`${detailUrl}$`));
  });

  test("en mora siempre es el total pendiente aunque la URL diga otra cosa", async ({ page, bff }) => {
    await mockConsumption(bff, {
      detail: consumptionDetail((core) => {
        core.consumption.status = "VENCIDO_CON_MORA";
        core.debt.nextInstallment = null;
      }),
      quote: paymentData(({ consumption }) => {
        consumption.nextInstallment = null;
        consumption.options = [consumption.allPending];
      }),
    });
    await page.goto(`${instructionsUrl}?option=PROXIMA`);

    await expect(amountCard(page)).toContainText("Bs. 103.116,44");
    await expect(page.getByRole("link", { name: "Ya pagué · Reportar pago" })).toHaveAttribute(
      "href",
      `/installments/${clinicaId}/report?option=TODAS`,
    );
  });

  test("con un pago en revisión no ofrece reportar otro", async ({ page, bff }) => {
    await mockConsumption(bff, {
      detail: consumptionDetail((core) => {
        core.installments[0] = { ...core.installments[0], status: "EN_REVISION", isNext: false };
      }),
    });
    await page.goto(`${instructionsUrl}?option=PROXIMA`);

    await expect(page.getByText("Ya tienes un pago en validación para este consumo.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ya pagué · Reportar pago" })).toHaveCount(0);
  });

  test("sin datos de pago configurados pide contactar a soporte", async ({ page, bff }) => {
    await mockConsumption(bff);
    await bff.respond(`**/api/installments/${clinicaId}/payment-data`, {
      status: 404,
      body: { error: "payment_data_unconfigured" },
    });
    await page.goto(`${instructionsUrl}?option=PROXIMA`);

    await expect(page.getByText("Los datos de pago no están disponibles. Contacta a soporte.")).toBeVisible();
  });
});
