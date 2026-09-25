import { consumptionDetail, expect, paymentData, test } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const detailApi = `**/api/installments/${clinicaId}`;
const quoteApi = `**/api/installments/${clinicaId}/payment-data`;

test.describe("Errores de Mis cuotas, detalle e instrucciones", () => {
  test("sesión vencida en la lista lleva a iniciar sesión de nuevo", async ({ page, bff }) => {
    await bff.respond("**/api/installments", { status: 401, body: { error: "unauthenticated" } });

    await page.goto("/installments");
    await page.waitForURL(/\/\?auth=expired/);
  });

  test("sesión vencida al cotizar desde las instrucciones", async ({ page, bff }) => {
    await bff.respond(detailApi, { body: consumptionDetail() });
    await bff.respond(quoteApi, { status: 401, body: { error: "unauthenticated" } });

    await page.goto(`/installments/${clinicaId}/payment?option=PROXIMA`);
    await page.waitForURL(/\/\?auth=expired/);
  });

  test("sin conexión en la lista pide revisar internet", async ({ page, bff }) => {
    await bff.disconnect("**/api/installments");

    await page.goto("/installments");
    await expect(page.getByRole("heading", { name: "No pudimos cargar tus cuotas" })).toBeVisible();
    await expect(page.getByText("Revisa tu conexión a internet e inténtalo nuevamente.")).toBeVisible();
  });

  test("sin conexión en el detalle pide revisar internet", async ({ page, bff }) => {
    await bff.disconnect(detailApi);

    await page.goto(`/installments/${clinicaId}`);
    await expect(page.getByRole("heading", { name: "No pudimos cargar el consumo" })).toBeVisible();
    await expect(page.getByText("Revisa tu conexión a internet e inténtalo nuevamente.")).toBeVisible();
  });

  test("una respuesta con formato inesperado no muestra datos a medias", async ({ page, bff }) => {
    await bff.respond("**/api/installments", {
      body: { consumptions: [{ consumptionId: clinicaId, label: "Clínica" }] },
    });
    await bff.respond(detailApi, { body: { consumption: { label: "Clínica" } } });

    await page.goto("/installments");
    await expect(page.getByRole("heading", { name: "No pudimos cargar tus cuotas" })).toBeVisible();

    await page.goto(`/installments/${clinicaId}`);
    await expect(page.getByRole("heading", { name: "No pudimos cargar el consumo" })).toBeVisible();
    await expect(page.getByRole("region", { name: /Resumen de/ })).toHaveCount(0);
  });

  test("error del servidor al cotizar deja ver el cronograma y permite reintentar", async ({ page, bff }) => {
    await bff.respond(detailApi, { body: consumptionDetail() });
    await bff.respond(quoteApi, { status: 502, body: { error: "upstream_error" } });

    await page.goto(`/installments/${clinicaId}`);
    await expect(page.getByRole("region", { name: "Tus cuotas" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.getByText("No pudimos calcular el monto a pagar.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver instrucciones de pago" })).toHaveCount(0);
  });

  test("si el navegador no deja copiar, lo explica", async ({ page, bff }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("Denegado", "NotAllowedError")) },
      });
    });
    await bff.respond(detailApi, { body: consumptionDetail() });
    await bff.respond(quoteApi, { body: paymentData() });

    await page.goto(`/installments/${clinicaId}/payment?option=PROXIMA`);
    await page.getByRole("button", { name: "Copiar teléfono" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "No pudimos copiar el dato. Puedes seleccionarlo y copiarlo manualmente." }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Teléfono copiado" })).toHaveCount(0);
  });
});
