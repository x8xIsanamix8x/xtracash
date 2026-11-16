import { expect, test } from "../support/app";

const productId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e71";
const purchaseId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e72";

function plan(percentage: string, insufficient = false) {
  const principal = percentage === "40" ? "400.00" : "300.00";
  const upfront = percentage === "40" ? "435.00" : "335.00";
  const financed = percentage === "40" ? "600.00" : "700.00";
  return {
    precio: { usdt: "1000.00", bs: "233759.40" },
    disponible: { usdt: "1500.00", bs: "350639.10" },
    cupoUsable: true,
    opcionesInicial: ["30", "40", "50", "100"].map((porcentaje) => ({
      porcentaje,
      inicial: { usdt: porcentaje === "40" ? "400.00" : "300.00" },
      pagoInicial: { usdt: porcentaje === "40" ? "435.00" : "335.00" },
      aFinanciar: { usdt: porcentaje === "40" ? "600.00" : "700.00" },
      cuotas: porcentaje === "100" ? 0 : 6,
      montoCuota: { usdt: "116.67" },
    })),
    plan: {
      inicialPorcentaje: percentage,
      inicial: { usdt: principal },
      pagoInicial: { usdt: upfront },
      aFinanciar: { usdt: financed },
      cuotas: 6,
      montoCuota: { usdt: "116.67" },
      servicioLegal: { usdt: "25.00" },
      servicioAdministrativo: { usdt: "10.00" },
      valida: true,
      alcanzaCupo: !insufficient,
      ...(insufficient ? { motivo: "CUPO_INSUFICIENTE" } : {}),
      calendario: [],
    },
  };
}

test("la inicial personalizada recotiza con Core y crea con el pago inicial cotizado", async ({ page, bff }) => {
  await bff.respond(`**/api/marketplace/catalogo/${productId}`, {
    body: { id: productId, nombre: "Panel solar", precio: { usdt: "1000.00" }, imagenes: [] },
  });
  await bff.respond(`**/api/marketplace/catalogo/${productId}/planes**`, (url) => ({
    body: plan(url.searchParams.get("inicialPorcentaje") ?? "30"),
  }));
  await bff.respond("**/api/marketplace/marketplace/horario", { body: { abierto: true } });
  await bff.respond("**/api/marketplace/marketplace/cupo", {
    body: { estado: "ABIERTA", disponible: { usdt: "1500.00", bs: "350639.10" } },
  });
  await bff.respond("**/api/marketplace/compras**", (url, method) => {
    if (url.pathname.endsWith("/compras") && method === "POST") return { status: 201, body: { id: purchaseId } };
    if (url.pathname.endsWith("/compras")) return { body: [] };
    return { body: { id: purchaseId, etapa: "PAGAR_INICIAL", pagarA: null } };
  });
  await bff.respond("**/api/installments/banks", { body: [{ code: "0171", name: "Banesco" }] });
  await bff.respond("**/api/marketplace/datos-pago", { status: 503, body: { error: "not_configured" } });

  await page.goto(`/marketplace/${productId}`);
  await page.getByRole("button", { name: "Ir a plan de compra" }).click();
  const initialSelector = page.getByRole("combobox", { name: "Porcentaje de inicial" });
  await expect(initialSelector).toContainText("30%");
  await expect(page.getByText("Disponible vigente")).toBeVisible();
  await expect(page.getByText("Total del pago inicial: USDT 335,00")).toBeVisible();

  await initialSelector.click();
  await page.getByRole("option", { name: "40%" }).click();
  await expect(page.getByText("Total del pago inicial: USDT 435,00")).toBeVisible();
  expect(bff.queries(`/api/marketplace/catalogo/${productId}/planes`)).toContain("?inicialPorcentaje=40");

  await page.getByRole("button", { name: "Iniciar compra" }).click();
  await expect.poll(() => bff.sentBodies("/api/marketplace/compras").length).toBe(1);
  expect(bff.sentBodies("/api/marketplace/compras")[0]).toEqual({ productoId: productId, pagoInicialUsdt: 435 });
});

test("si el cupo no alcanza, permite solicitar la inicial automática sin iniciar la compra", async ({ page, bff }) => {
  await bff.respond(`**/api/marketplace/catalogo/${productId}`, {
    body: { id: productId, nombre: "Panel solar", precio: { usdt: "1000.00" }, imagenes: [] },
  });
  await bff.respond(`**/api/marketplace/catalogo/${productId}/planes**`, (url) => {
    const percentage = url.searchParams.get("inicialPorcentaje") ?? "30";
    return { body: plan(percentage, percentage === "40") };
  });
  await bff.respond("**/api/marketplace/marketplace/horario", { body: { abierto: true } });
  await bff.respond("**/api/marketplace/marketplace/cupo", {
    body: { estado: "ABIERTA", disponible: { usdt: "500.00", bs: "116879.70" } },
  });
  await bff.respond("**/api/marketplace/compras**", { body: [] });
  await bff.respond("**/api/installments/banks", { body: [{ code: "0171", name: "Banesco" }] });

  await page.goto(`/marketplace/${productId}`);
  await page.getByRole("button", { name: "Ir a plan de compra" }).click();
  const initialSelector = page.getByRole("combobox", { name: "Porcentaje de inicial" });
  await expect(initialSelector).toContainText("30%");
  await initialSelector.click();
  await page.getByRole("option", { name: "40%" }).click();
  await expect(page.getByText(/El disponible vigente no cubre/)).toBeVisible();
  await page.getByRole("button", { name: "Usar inicial automática" }).click();
  await expect(page.getByText(/Se aplicó la inicial automática calculada por el backend/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar compra" })).toBeEnabled();
  expect(bff.sentBodies("/api/marketplace/compras")).toHaveLength(0);
});
