import { consumptionDetail, expect, installmentsOverview, paymentData, test } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";

test.describe("SPEC-02 · Mis cuotas", () => {
  test("la pestaña Cuotas abre la lista de próximas cuotas", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });

    await page.goto("/home");
    await page.getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: "Cuotas" })
      .click();

    await expect(page).toHaveURL(/\/installments$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mis cuotas" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Cuotas" }),
    ).toHaveAttribute("aria-current", "page");

    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText("OCT");
    await expect(cards.nth(0)).toContainText("07");
    await expect(cards.nth(0)).toContainText("Clínica");
    await expect(cards.nth(0)).toContainText("Cuota 01");
    await expect(cards.nth(0)).toContainText("Bs. 34.372,09");
    await expect(cards.nth(1)).toContainText("Mercado");
  });

  test("resalta como Próxima solo la obligación más cercana", async ({ page, bff }) => {
    await bff.respond("**/api/installments", {
      body: installmentsOverview(({ cuotas }) => {
        // Mercado vence después que Clínica.
        cuotas.installments[1].dueDate = "2026-10-20";
      }),
    });

    await page.goto("/installments");
    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards.nth(0)).toContainText("Próxima");
    await expect(cards.nth(1)).toContainText("Pendiente");
    await expect(cards.nth(1)).toContainText("OCT20");
  });

  test("ordena por fecha: la más cercana arriba", async ({ page, bff }) => {
    await bff.respond("**/api/installments", {
      body: installmentsOverview(({ cuotas }) => {
        // Mercado (consumo más nuevo) vence antes que Clínica.
        cuotas.installments[1].dueDate = "2026-10-01";
      }),
    });

    await page.goto("/installments");
    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards.nth(0)).toContainText("Mercado");
    await expect(cards.nth(0)).toContainText("Próxima");
    await expect(cards.nth(1)).toContainText("Clínica");
    await expect(cards.nth(1)).toContainText("Pendiente");
  });

  test("tocar una cuota abre los datos de pago de ese consumo", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });

    await page.goto("/installments");
    await page.getByRole("link", { name: /Clínica/ }).click();
    await expect(page).toHaveURL(`/installments/${clinicaId}/payment?option=PROXIMA&from=list`);
    await expect(page.getByRole("heading", { level: 1, name: "Instrucciones de pago" })).toBeVisible();
  });

  test("volver desde los datos de pago regresa a Próximas cuotas sin volver a pedirlas", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await bff.respond(`**/api/installments/${clinicaId}`, { body: consumptionDetail() });
    await bff.respond(`**/api/installments/${clinicaId}/payment-data`, { body: paymentData() });

    await page.goto("/installments");
    await page.getByRole("link", { name: /Clínica/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Instrucciones de pago" })).toBeVisible();

    const back = page.getByRole("link", { name: "Volver a mis cuotas" });
    await expect(back).toBeVisible();
    // El volver está a la izquierda del título.
    const [backBox, titleBox] = await Promise.all([
      back.boundingBox(),
      page.getByRole("heading", { level: 1 }).boundingBox(),
    ]);
    expect(backBox!.x).toBeLessThan(titleBox!.x);

    await back.click();
    await expect(page).toHaveURL(/\/installments$/);
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
    expect(bff.calls("/api/installments")).toBe(1);
  });

  test("en mora lleva a pagar todo; en revisión no se puede tocar", async ({ page, bff }) => {
    await bff.respond("**/api/installments", {
      body: installmentsOverview(({ cuotas }) => {
        cuotas.installments[0].status = "EN_MORA";
        cuotas.installments[0].isNext = false;
        cuotas.installments[1].status = "EN_REVISION";
        cuotas.installments[1].isNext = false;
      }),
    });

    await page.goto("/installments");
    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards.nth(0)).toContainText("En mora");
    await expect(cards.nth(0).getByRole("link")).toHaveAttribute(
      "href",
      `/installments/${clinicaId}/payment?option=TODAS&from=list`,
    );
    await expect(cards.nth(1)).toContainText("En revisión");
    await expect(cards.nth(1).getByRole("link")).toHaveCount(0);
  });

  test("funciona a 360 px sin scroll horizontal", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await page.setViewportSize({ width: 360, height: 740 });

    await page.goto("/installments");
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test("sin cuotas pendientes muestra que está al día", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: { consumptions: [] } });

    await page.goto("/installments");
    await expect(page.getByRole("heading", { name: "Estás al día" })).toBeVisible();
    await expect(page.getByText("No tienes cuotas pendientes por pagar.")).toBeVisible();

    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test("si falla la carga permite reintentar", async ({ page, bff }) => {
    let fail = true;
    await bff.respond("**/api/installments", () => (
      fail
        ? { status: 503, body: { error: "service_unavailable" } }
        : { body: installmentsOverview() }
    ));

    await page.goto("/installments");
    await expect(page.getByRole("heading", { name: "No pudimos cargar tus cuotas" })).toBeVisible();

    fail = false;
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
  });
});
