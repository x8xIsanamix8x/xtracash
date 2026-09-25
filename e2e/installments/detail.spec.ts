import { consumptionDetail, expect, installmentsOverview, test } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const detailUrl = `/installments/${clinicaId}`;
const detailApi = `**/api/installments/${clinicaId}`;

test.describe("SPEC-03 · Detalle del consumo", () => {
  test("muestra la cabecera y el cronograma tipo calendario", async ({ page, bff }) => {
    await bff.respond(detailApi, { body: consumptionDetail() });

    await page.goto(detailUrl);

    const summary = page.getByRole("region", { name: "Resumen de Clínica" });
    await expect(summary.getByRole("heading", { name: "Clínica" })).toBeVisible();
    await expect(summary).toContainText("3 cuotas · cada 15 días");
    await expect(summary).toContainText("Al día");
    await expect(summary).toContainText("Capital pendiente");
    await expect(summary).toContainText("Bs. 103.116,44");
    await expect(summary).not.toContainText("Próxima");

    const rows = page.getByRole("region", { name: "Tus cuotas" }).getByRole("listitem");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("OCT");
    await expect(rows.nth(0)).toContainText("07");
    await expect(rows.nth(0)).toContainText("Cuota 01");
    await expect(rows.nth(0)).toContainText("Bs. 34.372,09");
    await expect(rows.nth(0)).toContainText("Próxima");
    await expect(rows.nth(0)).toContainText("Vence el 7 de octubre de 2026");
    await expect(rows.nth(1)).toContainText("Pendiente");
    await expect(rows.nth(2)).toContainText("NOV");
  });

  test("con muchas cuotas el calendario se desplaza de lado y arranca en la próxima", async ({ page, bff }) => {
    await bff.respond(detailApi, {
      body: consumptionDetail((core) => {
        const base = core.installments[0];
        core.consumption.installments = 6;
        core.installments = [1, 2, 3, 4, 5, 6].map((number) => ({
          ...base,
          installmentId: `01a0cb0f-7b41-7d8d-9ef7-d30e8ad88f0${number}`,
          number,
          dueDate: `2026-10-${String(number * 4).padStart(2, "0")}`,
          status: number <= 3 ? "PAGADA" : "PENDIENTE",
          isNext: number === 4,
          paidOn: number <= 3 ? "2026-10-01" : null,
        }));
      }),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(detailUrl);

    const calendar = page.getByRole("list", { name: "Tus cuotas" });
    await expect(calendar.getByRole("listitem")).toHaveCount(6);
    const layout = await calendar.evaluate((list) => ({
      rowScrolls: list.scrollWidth > list.clientWidth,
      scrolledToNext: list.scrollLeft > 0,
      pageScrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
    }));
    expect(layout).toEqual({ rowScrolls: true, scrolledToNext: true, pageScrollsSideways: false });
    await expect(calendar.getByRole("listitem").nth(3)).toContainText("Próxima");
    await expect(calendar.getByRole("listitem").nth(3)).toBeInViewport({ ratio: 1 });
  });

  test("con una sola cuota la hoja no se estira: mismo tamaño que con muchas", async ({ page, bff }) => {
    await bff.respond(detailApi, {
      body: consumptionDetail((core) => {
        core.consumption.installments = 1;
        core.installments = [core.installments[0]];
      }),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(detailUrl);

    const card = page.getByRole("list", { name: "Tus cuotas" }).getByRole("listitem");
    await expect(card).toHaveCount(1);
    expect((await card.boundingBox())?.width).toBe(118);
  });

  test("la página termina donde termina el contenido: sin franja vacía abajo", async ({ page, bff }) => {
    await bff.respond(detailApi, { body: consumptionDetail() });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(detailUrl);
    await expect(page.getByRole("list", { name: "Tus cuotas" }).getByRole("listitem")).toHaveCount(3);

    const heights = await page.evaluate(() => ({
      page: document.documentElement.scrollHeight,
      main: Math.round(document.querySelector("main")!.getBoundingClientRect().height),
    }));
    expect(heights.page).toBe(heights.main);
  });

  test("muestra cuotas pagadas, en mora y en revisión", async ({ page, bff }) => {
    await bff.respond(detailApi, {
      body: consumptionDetail((core) => {
        core.consumption.status = "VENCIDO_CON_MORA";
        core.installments[0] = { ...core.installments[0], status: "PAGADA", isNext: false, paidOn: "2026-10-05" };
        core.installments[1] = { ...core.installments[1], status: "EN_MORA", isNext: false };
        core.installments[2] = { ...core.installments[2], status: "EN_REVISION", isNext: false };
        core.debt.nextInstallment = null;
      }),
    });

    await page.goto(detailUrl);

    await expect(page.getByRole("region", { name: "Resumen de Clínica" })).toContainText("En mora");
    const rows = page.getByRole("region", { name: "Tus cuotas" }).getByRole("listitem");
    await expect(rows.nth(0)).toContainText("Pagada");
    await expect(rows.nth(1)).toContainText("En mora");
    await expect(rows.nth(2)).toContainText("En revisión");
    await expect(rows.nth(2)).not.toContainText("Tu pago está en validación");
  });

  test("un consumo pagado lo indica", async ({ page, bff }) => {
    await bff.respond(detailApi, {
      body: consumptionDetail((core) => {
        core.consumption.status = "PAGADO";
        core.installments = core.installments.map((item) => ({
          ...item,
          status: "PAGADA",
          isNext: false,
          paidOn: "2026-10-01",
        }));
        core.debt = { nextInstallment: null, allPending: null };
      }),
    });

    await page.goto(detailUrl);
    await expect(page.getByText("Este consumo está pagado.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Resumen de Clínica" })).toContainText("Bs. 0,00");
  });

  test("volver del detalle lleva al Inicio (al detalle se entra desde el Home)", async ({ page, bff }) => {
    await bff.respond(detailApi, { body: consumptionDetail() });

    await page.goto(detailUrl);
    await expect(page.getByRole("region", { name: "Resumen de Clínica" })).toBeVisible();

    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test("un consumo que no existe muestra 'No encontramos este consumo'", async ({ page, bff }) => {
    await bff.respond(detailApi, { status: 404, body: { error: "consumption_not_found" } });

    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: "No encontramos este consumo" })).toBeVisible();

    await page.goto("/installments/no-es-un-id");
    await expect(page.getByRole("heading", { name: "No encontramos este consumo" })).toBeVisible();
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await page.getByRole("link", { name: "Ver mis cuotas" }).click();
    await expect(page).toHaveURL(/\/installments$/);
  });

  test("si falla la carga permite reintentar", async ({ page, bff }) => {
    let fail = true;
    await bff.respond(detailApi, () => (
      fail
        ? { status: 503, body: { error: "service_unavailable" } }
        : { body: consumptionDetail() }
    ));

    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: "No pudimos cargar el consumo" })).toBeVisible();

    fail = false;
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("region", { name: "Resumen de Clínica" })).toBeVisible();
  });
});
