import { newBusinessHomeMocks } from "../../src/features/home/data/newBusinessHomeMocks";
import { expect, test, type Page } from "../support/app";

const guideName = "Instala Impúlsate Móvil";

async function openHome(page: Page, url = "/home") {
  await page.goto(url);
  await expect(page.locator("main h1")).toBeVisible();
}

async function signalInstallAvailable(page: Page) {
  await page.evaluate(() => {
    Reflect.set(window, "testInstallPromptCalls", 0);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => {
        Reflect.set(window, "testInstallPromptCalls", Reflect.get(window, "testInstallPromptCalls") + 1);
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
}

test.beforeEach(async ({ bff }) => {
  await bff.respond("**/api/home/summary", { body: newBusinessHomeMocks.newcomer });
});

test("el aviso abre Perfil en Instalar y conserva la instalación para ese botón", async ({ page }, testInfo) => {
  await openHome(page);
  await signalInstallAvailable(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await expect(guide).toContainText("Entra a Perfil y abre la sección Instalar");
  const image = guide.getByRole("img", { name: /Nuestra mascota/ });
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("aviso-instalacion.png") });
  expect(await page.evaluate(() => Reflect.get(window, "testInstallPromptCalls"))).toBe(0);

  await guide.getByRole("link", { name: "Ir a Perfil" }).click();
  await expect(page).toHaveURL(/\/profile\?tab=install$/);
  await expect(page.getByRole("tab", { name: "Instalar", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Instalar aplicación", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Instalar aplicación", exact: true }).click();
  expect(await page.evaluate(() => Reflect.get(window, "testInstallPromptCalls"))).toBe(1);
});

test("recuerda el cierre y no repite el aviso al volver a Inicio", async ({ page }) => {
  await openHome(page);
  await signalInstallAvailable(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await guide.getByRole("button", { name: "Ahora no" }).click();
  await expect(guide).not.toBeVisible();
  await page.reload();
  await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
  await signalInstallAvailable(page);
  await page.getByRole("link", { name: "Perfil", exact: true }).click();
  await page.getByRole("tab", { name: "Instalar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Instalar aplicación", exact: true })).toBeVisible();
  await page.getByLabel("Volver al inicio", { exact: true }).click();
  await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
  await expect(guide).not.toBeVisible();
});

test("no ofrece el aviso cuando el navegador no tiene instalación disponible", async ({ page }) => {
  await openHome(page);
  await expect(page.getByRole("dialog", { name: guideName })).not.toBeVisible();
  await page.getByRole("link", { name: "Perfil", exact: true }).click();
  await page.getByRole("tab", { name: "Instalar", exact: true }).click();
  await expect(page.getByText("La instalación directa no está disponible en este navegador.", { exact: false })).toBeVisible();
  await expect(page.getByRole("dialog", { name: guideName })).not.toBeVisible();
});

test("no ofrece instalar si la app ya está en modo standalone", async ({ page }) => {
  await page.addInitScript(() => {
    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const result = originalMatchMedia(query);
      if (query === "(display-mode: standalone)") Object.defineProperty(result, "matches", { value: true });
      return result;
    };
  });
  await openHome(page);
  await signalInstallAvailable(page);
  await expect(page.getByRole("dialog", { name: guideName })).not.toBeVisible();
  await page.getByRole("link", { name: "Perfil", exact: true }).click();
  await page.getByRole("tab", { name: "Instalar", exact: true }).click();
  await expect(page.getByText("Impúlsate Móvil ya está instalada en este dispositivo.")).toBeVisible();
});

test("Safari en iOS abre el aviso y lleva a las instrucciones de instalación", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1" });
    Object.defineProperty(navigator, "platform", { value: "iPhone" });
    Object.defineProperty(navigator, "maxTouchPoints", { value: 5 });
  });
  await openHome(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await guide.getByRole("link", { name: "Ir a Perfil" }).click();
  await expect(page.getByRole("tab", { name: "Instalar", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Toca Compartir.")).toBeVisible();
  await expect(page.getByText("Selecciona “Agregar a pantalla de inicio”.")).toBeVisible();
});

test("espera al cierre del onboarding para mostrar el aviso de instalación", async ({ page, bff }) => {
  await bff.respond("**/api/home/summary", {
    body: {
      name: "Usuario Prueba",
      accountStatus: "ACTIVE",
      product: { limitBs: "500000.00", availableBs: "500000.00" },
      payments: { hasPendingPayment: false, nextCutoffDate: null, currentDebtBs: null, minimumPaymentBs: null, delinquencyStage: "AL_DIA" },
      movements: [],
      onboardingMaster: { completedPhases: 1 },
    },
  });
  await page.goto("/home?scenario=newcomer");
  await expect(page.getByRole("link", { name: "Continuar mi onboarding" })).toBeVisible();
  await signalInstallAvailable(page);
  await expect(page.getByRole("dialog", { name: guideName })).not.toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page.getByRole("dialog", { name: guideName })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
});

test("el modal cabe en móvil pequeño y escritorio con los controles siempre visibles", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page);
  await signalInstallAvailable(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();

  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const bounds = await guide.boundingBox();
    const descriptionBounds = await guide.locator("#pwa-install-guide-description").boundingBox();
    const actionBounds = await guide.getByRole("link", { name: "Ir a Perfil" }).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(descriptionBounds!.y + descriptionBounds!.height).toBeLessThanOrEqual(actionBounds!.y);
    await page.screenshot({ path: testInfo.outputPath(`aviso-${viewport.width}.png`) });
  }
  await page.keyboard.press("Escape");
  await expect(guide).not.toBeVisible();
});

test("el aviso se oculta si se instala la app mientras está abierto", async ({ page }) => {
  await openHome(page);
  await signalInstallAvailable(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(guide).not.toBeVisible();
});
