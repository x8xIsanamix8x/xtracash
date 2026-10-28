import { expect, test } from "../support/app";

const paymentContext = {
  availableBs: "143963.72",
  accessStatus: "active",
  banks: [{ code: "0134", name: "Banesco" }],
  contacts: [],
};

test.beforeEach(async ({ bff }) => {
  await bff.respond("**/api/mobile-payment/context", { body: paymentContext });
});

test("explica el beneficio y los plazos sin iniciar un pago, y recuerda el cierre", async ({ page, bff }, testInfo) => {
  await page.goto("/mobile-payment");
  const guide = page.getByRole("dialog");
  await expect(guide).toHaveAccessibleName("Disfruta 15 días sin intereses");
  await expect(guide).toContainText("Paga el total de tu consumo");
  await expect(guide).toContainText("La comisión del Pago Móvil se mantiene.");
  await expect(guide.getByRole("img", { name: /Nuestra mascota/ })).toBeVisible();
  await expect.poll(() => guide.getByRole("img", { name: /Nuestra mascota/ }).evaluate(
    (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
  )).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("beneficio.png") });

  await guide.getByRole("button", { name: "Conoce tus plazos" }).click();
  await expect(guide).toHaveAccessibleName("Tu monto define tu plazo");
  const table = guide.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(6);
  await expect(table.getByRole("row", { name: "Hasta $50 1 15 días", exact: true })).toBeVisible();
  await expect(table.getByRole("row", { name: "Más de $500 hasta $1.000 5 75 días", exact: true })).toBeVisible();
  await expect(table.getByRole("row", { name: "Más de $1.000 6 90 días", exact: true })).toBeVisible();
  await expect(guide).toContainText("Si pides el equivalente a $150, tendrás 3 cuotas en 45 días");
  await expect(guide).toContainText("pagos cada 15 días");
  await page.screenshot({ path: testInfo.outputPath("plazos.png") });

  await guide.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(guide).toHaveAccessibleName("Avanza con todo claro");
  await expect(guide).toContainText("Desde el día 16 se generan intereses sobre el saldo pendiente");
  await page.screenshot({ path: testInfo.outputPath("confirmacion.png") });
  await guide.getByRole("button", { name: "Entendido, usar mi disponible" }).click();
  await expect(guide).not.toBeVisible();
  const launcher = page.getByRole("button", { name: "Cómo funciona el Pago Móvil" });
  await expect(launcher).toBeFocused();
  await expect(page.getByRole("region", { name: "Usar disponible" })).not.toContainText("15 días sin intereses");
  await page.screenshot({ path: testInfo.outputPath("pantalla-inicial.png") });
  expect(bff.calls("/api/mobile-payment/operations")).toBe(0);

  await page.reload();
  await expect(launcher).toBeVisible();
  await expect(guide).not.toBeVisible();
  await launcher.click();
  await expect(guide).toHaveAccessibleName("Disfruta 15 días sin intereses");
});

test("cerrar, reabrir y navegar conserva los datos ingresados", async ({ page }) => {
  await page.goto("/mobile-payment");
  const guide = page.getByRole("dialog");
  await guide.getByRole("button", { name: "Cerrar guía de Pago Móvil" }).click();
  await page.getByRole("textbox", { name: "Monto a enviar" }).fill("1500");
  await page.getByRole("textbox", { name: "Concepto" }).fill("Insumos de mi negocio");
  await page.getByRole("button", { name: "Cómo funciona el Pago Móvil" }).click();

  await page.keyboard.press("ArrowRight");
  await expect(guide).toHaveAccessibleName("Tu monto define tu plazo");
  await page.keyboard.press("ArrowLeft");
  await expect(guide).toHaveAccessibleName("Disfruta 15 días sin intereses");
  await guide.getByRole("button", { name: /Ir al paso 3/ }).click();
  await expect(guide).toHaveAccessibleName("Avanza con todo claro");
  await guide.getByRole("button", { name: "Volver al paso anterior" }).click();
  await expect(guide).toHaveAccessibleName("Tu monto define tu plazo");
  await page.keyboard.press("Escape");

  await expect(guide).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: "Monto a enviar" })).toHaveValue("1.500,00");
  await expect(page.getByRole("textbox", { name: "Concepto" })).toHaveValue("Insumos de mi negocio");
  await page.reload();
  await expect(page.getByRole("button", { name: "Cómo funciona el Pago Móvil" })).toBeVisible();
  await expect(guide).not.toBeVisible();
});

test("la guía se puede consultar con el disponible suspendido sin tapar la restricción", async ({ page, bff }) => {
  await bff.respond("**/api/mobile-payment/context", { body: { ...paymentContext, accessStatus: "suspended" } });
  await page.goto("/mobile-payment");
  await expect(page.getByRole("region", { name: "Usar disponible" }).getByRole("alert")).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Cómo funciona el Pago Móvil" }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Disfruta 15 días sin intereses");
});

test("en un móvil pequeño la tabla y los controles caben, y permite deslizar", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/mobile-payment");
  const guide = page.getByRole("dialog");
  await expect(guide).toBeVisible();
  const title = guide.getByRole("heading");
  await title.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 240, clientY: 150 });
  await title.dispatchEvent("pointerup", { pointerType: "touch", clientX: 110, clientY: 152 });
  await expect(guide).toHaveAccessibleName("Tu monto define tu plazo");
  const table = guide.getByRole("table");
  const guideBounds = await guide.boundingBox();
  const tableBounds = await table.boundingBox();
  expect(guideBounds).not.toBeNull();
  expect(tableBounds).not.toBeNull();
  expect(tableBounds!.x).toBeGreaterThanOrEqual(guideBounds!.x);
  expect(tableBounds!.x + tableBounds!.width).toBeLessThanOrEqual(guideBounds!.x + guideBounds!.width);
  await table.getByRole("row").last().scrollIntoViewIfNeeded();
  await expect(table.getByRole("row").last()).toBeVisible();
  const next = guide.getByRole("button", { name: "Siguiente", exact: true });
  const nextBounds = await next.boundingBox();
  expect(nextBounds!.y + nextBounds!.height).toBeLessThanOrEqual(568);
  await page.screenshot({ path: testInfo.outputPath("plazos-movil-pequeno.png") });
  await next.click();
  await guide.getByRole("button", { name: "Entendido, usar mi disponible" }).click();
  await expect(guide).not.toBeVisible();
});
