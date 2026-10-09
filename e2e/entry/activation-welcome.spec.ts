import { expect, test } from "@playwright/test";

const welcomeName = "Activa tu cuenta";
const seenKey = "impulsate:activation-guide:v1";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { error: "service_unavailable" } }));
});

test("muestra la bienvenida después del onboarding y conserva la primera aparición al recargar", async ({ page }) => {
  await page.goto("/");
  const welcome = page.getByRole("dialog", { name: welcomeName });
  await expect(welcome).not.toBeVisible();
  await page.getByRole("button", { name: "Omitir" }).click();
  await expect(welcome).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), seenKey)).toBe("true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await expect(welcome).not.toBeVisible();
});

test("la invitación abre activación, valida el correo y usa el servicio de contraseña existente", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("xtracash:onboarding-completed", "true"));
  await page.route("**/api/auth/recovery", (route) => route.fulfill({ json: {} }));
  await page.goto("/");
  await page.getByRole("dialog", { name: welcomeName }).getByRole("link", { name: "Activa tu cuenta" }).click();
  await expect(page).toHaveURL(/\/recover-password\?mode=activation$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Activa tu cuenta", exact: true })).toBeVisible();
  await expect(page.getByText(/correo electrónico con el que recibiste tu invitación/)).toBeVisible();
  const submit = page.getByRole("button", { name: "Enviar enlace de activación", exact: true });
  await submit.click();
  await expect(page.getByText("Ingresa tu correo electrónico.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Correo electrónico" }).fill("invitado@example.test");
  const request = page.waitForRequest((request) => request.url().endsWith("/api/auth/recovery") && request.method() === "POST");
  await submit.click();
  expect((await request).postDataJSON()).toEqual({ identifier: "invitado@example.test" });
  await expect(page.getByText("Revisa tu correo", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: welcomeName })).not.toBeVisible();
});

test("el enlace habitual de contraseña conserva la recuperación y no repite la bienvenida", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("xtracash:onboarding-completed", "true"));
  await page.goto("/");
  await page.getByRole("dialog", { name: welcomeName }).getByRole("button", { name: "Ya tengo una cuenta" }).click();
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page).toHaveURL(/\/recover-password$/);
  await expect(page.getByRole("heading", { name: "Recupera tu acceso", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar enlace", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la pantalla de acceso" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: welcomeName })).not.toBeVisible();
});

test("una sesión expirada abre el ingreso sin superponer la bienvenida", async ({ page }) => {
  await page.goto("/?auth=expired");
  await expect(page.getByText("Tu sesión ha expirado", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: welcomeName })).not.toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), seenKey)).toBeNull();
  await expect(page.getByRole("dialog")).toHaveCount(1);
});

test("la mascota y los controles caben en móvil pequeño y escritorio; Escape cierra la bienvenida", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("xtracash:onboarding-completed", "true"));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const welcome = page.getByRole("dialog", { name: welcomeName });
  await expect(welcome).toBeVisible();
  const image = welcome.getByRole("img", { name: /Nuestra mascota/ });
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(welcome.getByRole("heading")).toBeFocused();
  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const bounds = await welcome.boundingBox();
    const descriptionBounds = await welcome.locator("#activation-welcome-description").boundingBox();
    const actionBounds = await welcome.getByRole("link", { name: "Activa tu cuenta" }).boundingBox();
    const dismissBounds = await welcome.getByRole("button", { name: "Ya tengo una cuenta" }).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(dismissBounds!.y + dismissBounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(descriptionBounds!.y + descriptionBounds!.height).toBeLessThanOrEqual(actionBounds!.y);
    await page.screenshot({ path: testInfo.outputPath(`bienvenida-${viewport.width}.png`) });
  }
  await page.keyboard.press("Escape");
  await expect(welcome).not.toBeVisible();
  await page.reload();
  await expect(welcome).not.toBeVisible();
});
