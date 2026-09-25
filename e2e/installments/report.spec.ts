import {
  consumptionDetail,
  expect,
  installmentsOverview,
  paymentData,
  test,
} from "../support/app";
import type { BffMock, Page } from "../support/app";

const clinicaId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
const detailPath = `/api/installments/${clinicaId}`;
const quotePath = `${detailPath}/payment-data`;
const reportsPath = `${detailPath}/reports`;
const reportUrl = `/installments/${clinicaId}/report?option=CUOTAS&count=2`;

const created = {
  reportId: "01919c10-2b4e-7a31-8d52-9e0f1a2b3c4d",
  amount: { bs: "68744.18", usd: "80.45" },
  reportedAmountBs: "68744.18",
  paymentDate: "2026-09-24",
  receiptAttached: false,
};

async function openReport(
  page: Page,
  bff: BffMock,
  options: Readonly<{ detail?: ReturnType<typeof consumptionDetail>; url?: string }> = {},
) {
  // Fecha fija: "hoy" es el 24/09/2026 como en las respuestas de sandbox.
  await page.clock.setFixedTime(new Date("2026-09-24T12:00:00-04:00"));
  await bff.respond(`**${detailPath}`, { body: options.detail ?? consumptionDetail() });
  await bff.respond(`**${quotePath}*`, (url) => {
    const date = url.searchParams.get("paymentDate");
    if (date === "2026-09-22") {
      return {
        body: paymentData(({ consumption }) => {
          consumption.paymentDate = "2026-09-22";
          const options = consumption.options as Array<{ total: { bs: string } }>;
          options[1].total.bs = "68666.58";
        }),
      };
    }
    return { body: paymentData() };
  });
  await page.goto(options.url ?? reportUrl);
  await expect(page.getByRole("heading", { level: 1, name: "Reportar pago" })).toBeVisible();
}

async function fillValidForm(page: Page) {
  await page.getByRole("combobox", { name: /Banco desde el que pagaste/ }).click();
  await page.getByRole("option", { name: "Mercantil (0105)" }).click();
  await page.getByRole("textbox", { name: /Referencia de pago/ }).fill("000123456789");
  await page.getByRole("textbox", { name: /Número de teléfono/ }).fill("04141234567");
  await page.getByRole("checkbox", { name: "El monto corresponde a la opción seleccionada" }).check();
}

const amountField = (page: Page) => page.getByRole("textbox", { name: /Monto \(Bs\.\)/ });
const submitButton = (page: Page) => page.getByRole("button", { name: "Reportar pago" });

test.describe("SPEC-06/07 · Reporte de pago", () => {
  test("reporta el pago y muestra el comprobante del reporte", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 201, body: created });
    await bff.respond("**/api/installments", { body: installmentsOverview() });
    await openReport(page, bff);

    await expect(page.getByText("Pagando: Cuota 01 a 02")).toBeVisible();
    await expect(amountField(page)).toHaveValue("68744,18");
    await fillValidForm(page);
    await submitButton(page).click();

    await expect(page.getByRole("heading", { name: "¡Pago reportado!" })).toBeVisible();
    const summary = page.getByRole("region", { name: "¡Pago reportado!" }).getByRole("definition");
    await expect(summary).toHaveText([
      "Clínica",
      "Cuotas 01 a 02",
      "Mercantil",
      "000123456789",
      /^24 sep/,
      "0414 123 4567",
      "Bs. 68.744,18",
    ]);

    expect(bff.sentBodies(reportsPath)).toEqual([{
      option: "CUOTAS",
      installmentCount: 2,
      amountBs: "68744.18",
      senderBank: "0105",
      senderPhone: "04141234567",
      paymentDate: "2026-09-24",
      bankReference: "000123456789",
    }]);

    // Tras reportar se vuelven a pedir las cuotas (aparecen "En revisión").
    const detailCalls = bff.calls(detailPath);
    await page.getByRole("link", { name: "Ver mis cuotas" }).click();
    await expect(page).toHaveURL(/\/installments$/);
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
    expect(bff.calls("/api/installments")).toBeGreaterThanOrEqual(1);
    expect(bff.calls(detailPath)).toBeGreaterThanOrEqual(detailCalls);
  });

  test("no envía con campos vacíos y enfoca el primero con error", async ({ page, bff }) => {
    await openReport(page, bff);
    await submitButton(page).click();

    await expect(page.getByText("Selecciona el banco desde el que pagaste.")).toBeVisible();
    await expect(page.getByText("Ingresa el número de referencia completo (solo números).")).toBeVisible();
    await expect(page.getByText(/Ingresa un número móvil válido/)).toBeVisible();
    await expect(page.getByText("Confirma que el monto corresponde a la opción seleccionada.")).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Banco desde el que pagaste/ })).toBeFocused();
    expect(bff.sentBodies(reportsPath)).toHaveLength(0);
  });

  test("no deja reportar menos de lo que cuesta la opción", async ({ page, bff }) => {
    await openReport(page, bff);
    await fillValidForm(page);
    await amountField(page).fill("50000");
    await submitButton(page).click();

    await expect(page.getByText("El monto no puede ser menor a Bs. 68.744,18.")).toBeVisible();
    expect(bff.sentBodies(reportsPath)).toHaveLength(0);
  });

  test("al cambiar la fecha recalcula el monto con la tasa de ese día", async ({ page, bff }) => {
    await openReport(page, bff);

    await page.getByLabel(/Fecha del pago/).fill("2026-09-22");
    await expect(amountField(page)).toHaveValue("68666,58");
    await expect(page.getByText("Monto de la opción a esa fecha: Bs. 68.666,58")).toBeVisible();
    expect(bff.queries(quotePath)).toContain("?paymentDate=2026-09-22");

    await page.getByLabel(/Fecha del pago/).fill("2026-09-20");
    await expect(page.getByText("La fecha no puede ser anterior al consumo.")).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
  });

  test("sin tasa para la fecha elegida no deja enviar", async ({ page, bff }) => {
    await openReport(page, bff);
    await bff.respond(`**${quotePath}?paymentDate=2026-09-23`, {
      status: 400,
      body: { error: "rate_unavailable" },
    });

    await page.getByLabel(/Fecha del pago/).fill("2026-09-23");
    await expect(page.getByText("No hay tasa registrada para esa fecha. Elige otra fecha.")).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
  });

  test("MONTO_NO_CUADRA: explica el motivo y al reintentar conserva los datos", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, {
      status: 400,
      body: { error: "amount_mismatch", expectedAmountBs: "68800.00", reportedAmountBs: "68744.18" },
    });
    await openReport(page, bff);
    await fillValidForm(page);
    await submitButton(page).click();

    const failure = page.getByRole("alert").filter({ hasText: "No pudimos reportar tu pago" });
    await expect(failure).toContainText("no cubre lo que debías a la fecha del pago (Bs. 68.800,00)");
    await expect(failure).toContainText("Monto que intentaste reportar");
    await expect(failure).toContainText("Bs. 68.744,18");
    await expect(page.getByRole("link", { name: "Contactar a soporte" })).toHaveAttribute("href", "/help");

    await page.getByRole("button", { name: "Intentar nuevamente" }).click();
    await expect(page.getByRole("textbox", { name: /Referencia de pago/ })).toHaveValue("000123456789");
    await expect(page.getByRole("textbox", { name: /Número de teléfono/ })).toHaveValue("04141234567");
    await expect(page.getByRole("combobox", { name: /Banco desde el que pagaste/ })).toContainText("Mercantil");
  });

  test("con un reporte ya en revisión no ofrece reintentar", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 409, body: { error: "report_pending" } });
    await openReport(page, bff);
    await fillValidForm(page);
    await submitButton(page).click();

    await expect(page.getByText(/Ya tienes un pago en validación para este consumo/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Intentar nuevamente" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Volver a cuotas" })).toBeVisible();
  });

  test("sin conexión al enviar permite reintentar", async ({ page, bff }) => {
    await bff.disconnect(`**${reportsPath}`);
    await openReport(page, bff);
    await fillValidForm(page);
    await submitButton(page).click();

    await expect(page.getByText(/Ocurrió un problema de conexión/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Intentar nuevamente" })).toBeVisible();
  });

  test("sesión vencida al enviar lleva a iniciar sesión", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 401, body: { error: "unauthenticated" } });
    await openReport(page, bff);
    await fillValidForm(page);
    await submitButton(page).click();

    await page.waitForURL(/\/\?auth=expired/);
  });

  test("error del servidor al enviar", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 502, body: { error: "upstream_error" } });
    await openReport(page, bff);
    await fillValidForm(page);
    await submitButton(page).click();

    await expect(page.getByText("Ocurrió un problema al enviar el reporte. Inténtalo nuevamente.")).toBeVisible();
  });

  test("comprobante: rechaza tipos no permitidos y envía uno válido", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 201, body: { ...created, receiptAttached: true } });
    await openReport(page, bff);
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({ name: "notas.txt", mimeType: "text/plain", buffer: Buffer.from("hola") });
    await expect(page.getByText("Adjunta un archivo JPG, PNG o PDF.")).toBeVisible();

    await fileInput.setInputFiles({
      name: "grande.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByText("El archivo no puede superar los 5 MB.")).toBeVisible();

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await fileInput.setInputFiles({ name: "comprobante.png", mimeType: "image/png", buffer: png });
    await expect(page.getByText("comprobante.png")).toBeVisible();
    await expect(page.getByText("El archivo no puede superar los 5 MB.")).toHaveCount(0);

    await fillValidForm(page);
    await submitButton(page).click();
    await expect(page.getByRole("heading", { name: "¡Pago reportado!" })).toBeVisible();

    const [body] = bff.sentBodies(reportsPath) as Array<{ receipt?: { fileName: string; contentBase64: string } }>;
    expect(body.receipt?.fileName).toBe("comprobante.png");
    expect(body.receipt?.contentBase64).toBe(png.toString("base64"));
  });

  test("doble clic en enviar manda un solo reporte", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 201, body: created });
    await openReport(page, bff);
    await fillValidForm(page);

    await submitButton(page).dblclick();
    await expect(page.getByRole("heading", { name: "¡Pago reportado!" })).toBeVisible();
    expect(bff.sentBodies(reportsPath)).toHaveLength(1);
  });

  test("en mora siempre reporta el total aunque la URL pida la próxima", async ({ page, bff }) => {
    await bff.respond(`**${reportsPath}`, { status: 201, body: created });
    await page.clock.setFixedTime(new Date("2026-09-24T12:00:00-04:00"));
    await bff.respond(`**${detailPath}`, {
      body: consumptionDetail((core) => {
        core.consumption.status = "VENCIDO_CON_MORA";
        core.debt.nextInstallment = null;
      }),
    });
    await bff.respond(`**${quotePath}*`, {
      body: paymentData(({ consumption }) => {
        consumption.nextInstallment = null;
        consumption.options = [consumption.allPending];
      }),
    });
    await page.goto(`/installments/${clinicaId}/report?option=PROXIMA`);

    await expect(page.getByText("Pagando: Cuota 01 a 03")).toBeVisible();
    await expect(amountField(page)).toHaveValue("103116,44");
    await fillValidForm(page);
    await submitButton(page).click();
    await expect(page.getByRole("heading", { name: "¡Pago reportado!" })).toBeVisible();
    expect(bff.sentBodies(reportsPath)).toEqual([expect.objectContaining({ option: "TODAS" })]);
  });

  test("con un pago en revisión no muestra el formulario", async ({ page, bff }) => {
    await openReport(page, bff, {
      detail: consumptionDetail((core) => {
        core.installments[0] = { ...core.installments[0], status: "EN_REVISION", isNext: false };
      }),
    });

    await expect(page.getByRole("heading", { name: "Pago en revisión" })).toBeVisible();
    await expect(submitButton(page)).toHaveCount(0);
  });
});
