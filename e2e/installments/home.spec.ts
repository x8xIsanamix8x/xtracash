import {
  consumptionDetail,
  coreFixture,
  expect,
  installmentsOverview,
  paymentData,
  test,
} from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";

test.describe("SPEC-08 · Integración con el Home", () => {
  test("el monto próximo suma todo lo que vence el día más cercano", async ({ page, bff }) => {
    await page.goto("/home");

    const debt = page.getByRole("region", { name: "Deuda total acumulada" });
    await expect(debt).toContainText("7 oct");
    // Clínica (34.372,09) + Mercado (25.263,59) vencen el 07/10.
    await expect(debt).toContainText("Bs. 59.635,68");
    expect(bff.calls("/api/home/summary")).toBeGreaterThan(0);
  });

  test("tocar un consumo abre su detalle", async ({ page, bff }) => {
    await bff.respond(`**/api/installments/${clinicaId}`, { body: consumptionDetail() });
    await bff.respond(`**/api/installments/${clinicaId}/payment-data`, { body: paymentData() });
    await page.goto("/home");

    await page.getByRole("link", { name: /Clínica/ }).click();
    await expect(page).toHaveURL(new RegExp(`/installments/${clinicaId}$`));
    await expect(page.getByRole("region", { name: "Resumen de Clínica" })).toBeVisible();
  });

  test("'Detalles de cuota' lleva a Mis cuotas", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await page.goto("/home");

    await expect(page.getByRole("button", { name: "Reportar cuota" })).toHaveCount(0);
    await page.getByRole("link", { name: "Detalles de cuota" }).click();
    await expect(page).toHaveURL(/\/installments$/);
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
  });

  test("con el disponible suspendido 'Reactivar' lleva a Mis cuotas", async ({ page, bff }) => {
    const summary = coreFixture<{ balance: { status: string } }>("resumen");
    summary.balance.status = "MORA";
    await bff.respond("**/api/home/summary", { body: summary });
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await page.goto("/home");

    await page.getByRole("link", { name: "Reactivar" }).click();
    await expect(page).toHaveURL(/\/installments$/);
  });
});
