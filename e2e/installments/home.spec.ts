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
  test("la card de deuda solo muestra el total acumulado", async ({ page, bff }) => {
    await page.goto("/home");

    const debt = page.getByRole("region", { name: "Deuda total acumulada" });
    await expect(debt).toContainText(/Bs\. [\d.]+,\d{2}/);
    await expect(debt).not.toContainText("Próxima cuota más cercana");
    await expect(debt).not.toContainText("Monto próximo a cancelar");
    await expect(debt.getByRole("link")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reportar cuota" })).toHaveCount(0);
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
