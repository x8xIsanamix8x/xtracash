import { expect, test } from "../support/app";

const productId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e71";
const purchaseId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e72";
const consumptionId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e73";
const catalogProductId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e74";

const purchase = {
  id: purchaseId,
  estado: "CONFIRMADA",
  etapa: "PAGAR_CUOTAS",
  consumoId: consumptionId,
  producto: { id: productId, version: 1, nombre: "Panel solar 550W" },
  precio: "400.00",
  inicialPorcentaje: "20",
  inicial: "80.00",
  pagoInicial: { usdt: "90.00", bs: "21038.35" },
  aFinanciar: "320.00",
  cuotas: 6,
  creadaEn: "2026-10-22T14:00:00Z",
  confirmadaEn: "2026-10-22T14:05:00Z",
  resumenCuotas: { total: 6, pagadas: 2, pendientes: 3, vencidas: 1, estadoDeuda: "VENCIDA" },
};

test("el disponible se jerarquiza y Categoría/Mis compras comparten la fila", async ({ page, bff }) => {
  await bff.respond("**/api/marketplace/marketplace/cupo", {
    body: { estado: "ABIERTA", limite: { usdt: "2500.00", bs: "584398.50" }, disponible: { usdt: "1500.00", bs: "350639.10" } },
  });
  await bff.respond("**/api/marketplace/catalogo/categorias", { body: [{ id: "category-energy", nombre: "Energía" }] });
  await bff.respond("**/api/marketplace/catalogo?**", {
    body: { items: [{ id: catalogProductId, nombre: "Panel solar", precio: { usdt: "400.00", bs: "93503.76" } }], page: 0, size: 20, totalPages: 1, totalElements: 1 },
  });

  await page.goto("/marketplace");
  const available = page.getByRole("region", { name: "Disponible de financiamiento" });
  await expect(available).toBeVisible();
  await expect(available).toContainText("USDT ••••••");
  const currencySize = await available.getByText("USDT", { exact: true }).evaluate((element) => getComputedStyle(element).fontSize);
  const maskedAmountSize = await available.getByText("••••••", { exact: true }).evaluate((element) => getComputedStyle(element).fontSize);
  expect(Number.parseFloat(currencySize)).toBeLessThan(Number.parseFloat(maskedAmountSize));
  await page.getByRole("button", { name: "Mostrar disponible" }).click();
  await expect(available.getByLabel("Disponible: USDT 1.500,00")).toBeVisible();
  await expect(available).toContainText("Línea total USDT 2.500,00");
  await page.getByRole("button", { name: "Mostrar en bolívares" }).click();
  await expect(available.getByLabel("Disponible: Bs. 350.639,10")).toBeVisible();
  await expect(available).toContainText("Línea total Bs. 584.398,50");
  await expect(page.getByText("USDT 400,00")).toBeVisible();

  const purchasesButton = page.getByRole("link", { name: "Mis compras" });
  const availableBounds = await available.boundingBox();
  const buttonBounds = await purchasesButton.boundingBox();
  expect(availableBounds).not.toBeNull();
  expect(buttonBounds).not.toBeNull();
  const categoryBounds = await page.getByTestId("marketplace-category-select").boundingBox();
  const searchBounds = await page.getByRole("textbox", { name: "Buscar productos" }).boundingBox();
  expect(categoryBounds).not.toBeNull();
  expect(searchBounds).not.toBeNull();
  expect(Math.abs(buttonBounds!.y - categoryBounds!.y)).toBeLessThanOrEqual(8);
  expect(Math.abs(buttonBounds!.width - categoryBounds!.width)).toBeLessThanOrEqual(1);
  expect(buttonBounds!.width).toBeLessThan(availableBounds!.width * 0.6);
  expect(categoryBounds!.y).toBeGreaterThan(availableBounds!.y + availableBounds!.height);
  expect(searchBounds!.y).toBeGreaterThan(categoryBounds!.y + categoryBounds!.height);
});

test("Mis compras abre el detalle y conecta cuotas solo si hay consumo confirmado", async ({ page, bff }) => {
  await bff.respond("**/api/marketplace/compras", { body: [purchase] });
  await bff.respond(`**/api/marketplace/compras/${purchaseId}`, { body: purchase });

  await page.goto("/marketplace/compras");
  await expect(page.getByRole("heading", { name: "Mis compras" })).toBeVisible();
  await page.getByRole("link", { name: "Ver compra de Panel solar 550W" }).click();

  await expect(page.getByRole("heading", { name: "Panel solar 550W" })).toBeVisible();
  await expect(page.getByText("Compra confirmada").first()).toBeVisible();
  await expect(page.getByText("Tienes cuotas vencidas")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver mis cuotas" })).toHaveAttribute("href", `/installments/${consumptionId}`);
});

test("retomar compra pendiente abre su compra exacta sin crear una nueva", async ({ page, bff }) => {
  await bff.respond(`**/api/marketplace/catalogo/${productId}`, {
    body: { id: productId, nombre: "Panel solar 550W", precio: { usdt: "400.00" }, imagenes: [] },
  });
  await bff.respond(`**/api/marketplace/catalogo/${productId}/planes**`, { body: {} });
  await bff.respond("**/api/marketplace/marketplace/horario", { body: { abierto: true } });
  await bff.respond("**/api/marketplace/marketplace/cupo", { body: { estado: "ABIERTA", disponible: { usdt: "500.00" } } });
  await bff.respond("**/api/marketplace/compras", { body: [] });
  await bff.respond(`**/api/marketplace/compras/${purchaseId}`, {
    body: { ...purchase, etapa: "PAGAR_INICIAL", consumoId: null, estado: "PENDIENTE", pagarA: null },
  });
  await bff.respond("**/api/marketplace/datos-pago", { status: 503, body: { error: "not_configured" } });
  await bff.respond("**/api/installments/banks", { body: [{ code: "0171", name: "Banesco" }] });

  await page.goto(`/marketplace/${productId}?compraId=${purchaseId}`);
  await expect(page.getByRole("heading", { name: "Realizar pago" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pagar inicial" })).toBeVisible();
  expect(bff.sentBodies("/api/marketplace/compras")).toHaveLength(0);
  expect(bff.calls(`/api/marketplace/compras/${purchaseId}`)).toBeGreaterThan(0);
});

test("una compra pagada muestra confirmación y no acceso a cuotas", async ({ page, bff }) => {
  const paidPurchase = { ...purchase, etapa: "PAGADA", consumoId: null };
  await bff.respond("**/api/marketplace/compras", { body: [paidPurchase] });
  await bff.respond(`**/api/marketplace/compras/${purchaseId}`, { body: paidPurchase });
  await page.goto("/marketplace/compras");
  await page.getByRole("link", { name: "Ver compra de Panel solar 550W" }).click();
  await expect(page.getByText(/no hay cuotas pendientes asociadas/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver mis cuotas" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Volver al catálogo" })).toBeVisible();
});

for (const etapa of ["PAGAR_CUOTAS", "PAGADA"] as const) {
  test(`el flujo de compra muestra la finalización desde el estado confirmado ${etapa}`, async ({ page, bff }) => {
    const confirmedPurchase = {
      ...purchase,
      etapa,
      consumoId: etapa === "PAGAR_CUOTAS" ? consumptionId : null,
    };
    await bff.respond(`**/api/marketplace/catalogo/${productId}`, {
      body: { id: productId, nombre: "Panel solar 550W", precio: { usdt: "400.00" }, imagenes: [] },
    });
    await bff.respond(`**/api/marketplace/catalogo/${productId}/planes**`, { body: {} });
    await bff.respond("**/api/marketplace/marketplace/horario", { body: { abierto: true } });
    await bff.respond("**/api/marketplace/marketplace/cupo", { body: { estado: "ABIERTA", disponible: { usdt: "500.00" } } });
    await bff.respond("**/api/marketplace/compras", { body: [confirmedPurchase] });
    await bff.respond(`**/api/marketplace/compras/${purchaseId}`, { body: confirmedPurchase });
    await bff.respond("**/api/installments/banks", { body: [{ code: "0171", name: "Banesco" }] });

    await page.goto(`/marketplace/${productId}?compraId=${purchaseId}`);
    await expect(page.getByRole("heading", { name: "¡Compra confirmada!" })).toBeVisible();
    await expect(page.getByText("Firma registrada correctamente.")).toBeVisible();
    await expect(page.getByText("Gracias por tu compra. Nuestro equipo se pondrá en contacto contigo a la brevedad para coordinar la instalación.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver detalles de mi compra" })).toHaveAttribute("href", `/marketplace/compras/${purchaseId}`);

    if (etapa === "PAGAR_CUOTAS") {
      await expect(page.getByRole("link", { name: "Ir a mis cuotas" })).toHaveAttribute("href", `/installments/${consumptionId}`);
    } else {
      await expect(page.getByRole("link", { name: "Ir a mis cuotas" })).toHaveCount(0);
    }
  });
}

test("solo presenta la finalización cuando Core confirma la firma", async ({ page, bff }) => {
  const waitingForSignature = { ...purchase, etapa: "ESPERANDO_FIRMAS", consumoId: null };
  const confirmedPurchase = { ...purchase, etapa: "PAGAR_CUOTAS" };
  let signatureSubmitted = false;
  await bff.respond(`**/api/marketplace/catalogo/${productId}`, {
    body: { id: productId, nombre: "Panel solar 550W", precio: { usdt: "400.00" }, imagenes: [] },
  });
  await bff.respond(`**/api/marketplace/catalogo/${productId}/planes**`, { body: {} });
  await bff.respond("**/api/marketplace/marketplace/horario", { body: { abierto: true } });
  await bff.respond("**/api/marketplace/marketplace/cupo", { body: { estado: "ABIERTA", disponible: { usdt: "500.00" } } });
  await bff.respond("**/api/marketplace/compras", { body: [waitingForSignature] });
  await bff.respond(`**/api/marketplace/compras/${purchaseId}`, () => ({ body: signatureSubmitted ? confirmedPurchase : waitingForSignature }));
  await bff.respond(`**/api/marketplace/compras/${purchaseId}/firma`, (_url, method) => {
    expect(method).toBe("POST");
    signatureSubmitted = true;
    return { body: confirmedPurchase };
  });
  await bff.respond("**/api/installments/banks", { body: [{ code: "0171", name: "Banesco" }] });

  await page.goto(`/marketplace/${productId}?compraId=${purchaseId}`);
  await page.getByRole("button", { name: "Revisar y firmar contrato" }).click();
  await expect(page.getByRole("heading", { name: "Revisa y firma tu contrato" })).toBeVisible();
  await page.getByLabel("Confirmo que revisé y acepto las condiciones del contrato.").check();
  await page.getByLabel("Acepto los términos y condiciones de esta compra.").check();
  await page.getByRole("button", { name: "Dibujar firma" }).click();
  const canvas = page.getByLabel("Área para dibujar la firma");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + 25, bounds!.y + 60);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 100, bounds!.y + 90, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Usar firma" }).click();
  await page.getByRole("button", { name: "Firmar contrato y confirmar" }).click();

  await expect(page.getByRole("heading", { name: "¡Compra confirmada!" })).toBeVisible();
  expect(bff.sentBodies(`/api/marketplace/compras/${purchaseId}/firma`)).toEqual([{ firmado: true }]);
  await expect(page.getByText("Gracias por tu compra. Nuestro equipo se pondrá en contacto contigo a la brevedad para coordinar la instalación.")).toBeVisible();
});
