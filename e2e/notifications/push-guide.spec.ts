import { expect, test, type Page } from "../support/app";

const guideName = "Activa tus notificaciones";
const seenKey = "impulsate:push-notifications-guide:v1";
const subscriptionPath = "/api/notifications/push/subscription";
const publicKeyPath = "/api/notifications/push/public-key";
const subscriptionPayload = {
  endpoint: "https://push.example.test/device",
  keys: { p256dh: "test-public-key", auth: "test-auth-key" },
};

type PushMockOptions = Readonly<{
  permission?: NotificationPermission;
  permissionResult?: NotificationPermission;
  hasSubscription?: boolean;
  registrationAvailable?: boolean;
  isIos?: boolean;
}>;

async function mockPush(page: Page, options: PushMockOptions = {}) {
  await page.addInitScript((settings) => {
    const state = {
      permission: settings.permission,
      hasSubscription: settings.hasSubscription,
      registrationChecks: 0,
      permissionCalls: 0,
      subscribeCalls: 0,
    };
    Reflect.set(window, "testPush", state);
    const subscription = {
      endpoint: "https://push.example.test/device",
      toJSON: () => ({ endpoint: "https://push.example.test/device", keys: { p256dh: "test-public-key", auth: "test-auth-key" } }),
      unsubscribe: async () => { state.hasSubscription = false; return true; },
    };
    const worker = {
      pushManager: {
        getSubscription: async () => state.hasSubscription ? subscription : null,
        subscribe: async () => {
          state.subscribeCalls += 1;
          state.hasSubscription = true;
          return subscription;
        },
      },
    };
    Object.defineProperty(navigator.serviceWorker, "getRegistration", {
      configurable: true,
      value: async () => {
        state.registrationChecks += 1;
        return settings.registrationAvailable ? worker : undefined;
      },
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        get permission() { return state.permission; },
        requestPermission: async () => {
          state.permissionCalls += 1;
          state.permission = settings.permissionResult;
          return state.permission;
        },
      },
    });
    if (!("PushManager" in window)) Object.defineProperty(window, "PushManager", { value: class {} });
    if (settings.isIos) {
      Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1" });
      Object.defineProperty(navigator, "platform", { value: "iPhone" });
      Object.defineProperty(navigator, "maxTouchPoints", { value: 5 });
    }
  }, {
    permission: options.permission ?? "default",
    permissionResult: options.permissionResult ?? "granted",
    hasSubscription: options.hasSubscription ?? false,
    registrationAvailable: options.registrationAvailable ?? true,
    isIos: options.isIos ?? false,
  });
}

async function openNotifications(page: Page) {
  await page.goto("/notifications");
  await expect(page.getByText("No tienes notificaciones disponibles por ahora.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "testPush").registrationChecks)).toBeGreaterThanOrEqual(2);
}

test.beforeEach(async ({ bff }) => {
  await bff.respond("**/api/notifications?*", { body: { items: [], page: 0, size: 20, total: 0 } });
  await bff.respond("**/api/notifications/unread-count", { body: { count: 0 } });
  await bff.respond(`**${publicKeyPath}`, {
    body: { publicKey: "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8" },
  });
  await bff.respond(`**${subscriptionPath}`, { body: {} });
});

for (const permission of ["default", "granted"] as const) {
  test(`permiso ${permission}: muestra el aviso y solo activa push al pulsar el botón`, async ({ page, bff }) => {
    await mockPush(page, { permission });
    await openNotifications(page);
    const guide = page.getByRole("dialog", { name: guideName });
    await expect(guide).toBeVisible();
    expect(await page.evaluate(() => Reflect.get(window, "testPush").permissionCalls)).toBe(0);
    expect(bff.calls(publicKeyPath)).toBe(0);
    expect(bff.calls(subscriptionPath)).toBe(0);

    const requestPromise = page.waitForRequest((request) => request.url().endsWith(subscriptionPath) && request.method() === "PUT");
    await guide.getByRole("button", { name: "Activar notificaciones", exact: true }).click();
    expect((await requestPromise).postDataJSON()).toEqual(subscriptionPayload);
    await expect(guide).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Activar", exact: true })).not.toBeVisible();
    expect(await page.evaluate(() => Reflect.get(window, "testPush").permissionCalls)).toBe(1);
    expect(await page.evaluate(() => Reflect.get(window, "testPush").subscribeCalls)).toBe(1);
  });
}

test("recuerda el primer aviso y permite activar push desde el botón habitual después", async ({ page, bff }) => {
  await mockPush(page);
  await openNotifications(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await guide.getByRole("button", { name: "Ahora no" }).click();
  await expect(guide).not.toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), seenKey)).toBe("true");
  await openNotifications(page);
  await expect(guide).not.toBeVisible();
  await page.getByRole("button", { name: "Activar", exact: true }).click();
  await expect.poll(() => bff.calls(subscriptionPath)).toBe(1);
  await expect(page.getByRole("button", { name: "Activar", exact: true })).not.toBeVisible();
});

test("recargar mientras el aviso está abierto también cuenta como la primera visita", async ({ page }) => {
  await mockPush(page);
  await openNotifications(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await openNotifications(page);
  await expect(page.getByRole("button", { name: "Activar", exact: true })).toBeVisible();
  await expect(guide).not.toBeVisible();
});

for (const scenario of [
  { name: "sin service worker registrado", options: { registrationAvailable: false } },
  { name: "permiso bloqueado", options: { permission: "denied" } },
  { name: "push ya activo", options: { permission: "granted", hasSubscription: true } },
  { name: "iPhone sin instalar la app", options: { isIos: true } },
] satisfies ReadonlyArray<{ name: string; options: PushMockOptions }>) {
  test(`no muestra ni registra el aviso: ${scenario.name}`, async ({ page }) => {
    await mockPush(page, scenario.options);
    await openNotifications(page);
    await expect(page.getByRole("dialog", { name: guideName })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Activar", exact: true })).not.toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), seenKey)).toBeNull();
    expect(await page.evaluate(() => Reflect.get(window, "testPush").permissionCalls)).toBe(0);
  });
}

test("respeta el rechazo del permiso y cierra el aviso sin suscribir el dispositivo", async ({ page, bff }) => {
  await mockPush(page, { permissionResult: "denied" });
  await openNotifications(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await guide.getByRole("button", { name: "Activar notificaciones", exact: true }).click();
  await expect(guide).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Activar", exact: true })).not.toBeVisible();
  expect(bff.calls(publicKeyPath)).toBe(0);
  expect(bff.calls(subscriptionPath)).toBe(0);
});

test("si falla el registro muestra el error y permite reintentar", async ({ page, bff }) => {
  await bff.respond(`**${subscriptionPath}`, { status: 503, body: { error: "service_unavailable" } });
  await mockPush(page);
  await openNotifications(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  await guide.getByRole("button", { name: "Activar notificaciones", exact: true }).click();
  await expect(guide.getByRole("alert")).toContainText("No pudimos activar las notificaciones.");
  await expect(guide.getByRole("button", { name: "Activar notificaciones", exact: true })).toBeEnabled();
  await bff.respond(`**${subscriptionPath}`, { body: {} });
  await guide.getByRole("button", { name: "Activar notificaciones", exact: true }).click();
  await expect(guide).not.toBeVisible();
  expect(bff.calls(subscriptionPath)).toBe(2);
  expect(bff.calls(publicKeyPath)).toBe(1);
});

test("la imagen y los controles caben en móvil pequeño y escritorio; Escape permite posponer", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockPush(page);
  await openNotifications(page);
  const guide = page.getByRole("dialog", { name: guideName });
  await expect(guide).toBeVisible();
  const image = guide.getByRole("img", { name: /Nuestra mascota/ });
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);

  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const bounds = await guide.boundingBox();
    const descriptionBounds = await guide.locator("#push-notifications-guide-description").boundingBox();
    const actionBounds = await guide.getByRole("button", { name: "Activar notificaciones", exact: true }).boundingBox();
    const dismissBounds = await guide.getByRole("button", { name: "Ahora no" }).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(dismissBounds!.y + dismissBounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(descriptionBounds!.y + descriptionBounds!.height).toBeLessThanOrEqual(actionBounds!.y);
    await page.screenshot({ path: testInfo.outputPath(`aviso-${viewport.width}.png`) });
  }
  await page.keyboard.press("Escape");
  await expect(guide).not.toBeVisible();
});
