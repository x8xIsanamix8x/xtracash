import { expect, installmentsOverview, test } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";

test.describe("SPEC-02 · Mis cuotas", () => {
  test("la pestaña Cuotas abre la lista, del consumo más viejo al más nuevo", async ({ page, bff }) => {
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
    await expect(cards.nth(0)).toContainText("Clínica");
    await expect(cards.nth(0)).toContainText("Bs. 100.000,00");
    await expect(cards.nth(0)).toContainText("0 cuotas pagadas de 3");
    await expect(cards.nth(0)).toContainText("Bs. 34.372,09");
    await expect(cards.nth(0)).toContainText("Cuota 01");
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
    await expect(cards.nth(1)).not.toContainText("Próxima");
  });

  test("muestra el peor estado de las cuotas del consumo", async ({ page, bff }) => {
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
    await expect(cards.nth(1)).toContainText("En revisión");
  });

  test("tocar una card abre el detalle de ese consumo", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });

    await page.goto("/installments");
    await page.getByRole("link", { name: /Clínica/ }).click();
    await expect(page).toHaveURL(new RegExp(`/installments/${clinicaId}$`));
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
