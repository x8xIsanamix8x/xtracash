import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = new URL("../../", import.meta.url);

test("el catálogo consume búsqueda, categorías, paginación e imágenes de Core", async () => {
  const [service, view, detail, image] = await Promise.all([
    readFile(new URL("src/features/marketplace/services/marketplace.ts", projectUrl), "utf8"),
    readFile(new URL("src/features/marketplace/MarketplaceView.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/marketplace/MarketplaceProductView.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/marketplace/components/MarketplaceProductImage.tsx", projectUrl), "utf8"),
  ]);
  assert.match(service, /catalogo\?\$\{params\}/);
  assert.match(service, /categoriaId/);
  assert.match(service, /page: String\(page\)/);
  assert.match(view, /getCatalog\(search, page/);
  assert.match(view, /getCatalogCategories/);
  assert.match(view, /imagenPrincipal/);
  assert.match(detail, /getProduct\(productId/);
  assert.match(detail, /activeImage\?\.url/);
  assert.match(image, /getMarketplaceImageSource/);
  assert.doesNotMatch(view, /-50%|SolarProductArtwork/);
});

test("el flujo llama servicios reales y no simula pagos, comprobantes ni importes", async () => {
  const flow = await readFile(new URL("src/features/marketplace/components/PurchasePlanFlow.tsx", projectUrl), "utf8");
  assert.match(flow, /getProductPlan/);
  assert.match(flow, /createPurchase/);
  assert.match(flow, /reportInitialPayment/);
  assert.match(flow, /requestC2pOtp/);
  assert.match(flow, /payC2p/);
  assert.match(flow, /getPurchase\(/);
  assert.match(flow, /Pago móvil en revisión/);
  assert.match(flow, /Compra confirmada/);
  assert.match(flow, /PlanAmountCard/);
  assert.match(flow, /Precio del equipo/);
  assert.match(flow, /Monto a financiar/);
  assert.match(flow, /Servicio administrativo/);
  assert.match(flow, /productImageUrl/);
  assert.doesNotMatch(flow, /Mascota|Orden #1234|Comprobante adjunto/);
});

test("recupera compras pendientes sin saltar automáticamente del plan al pago", async () => {
  const flow = await readFile(new URL("src/features/marketplace/components/PurchasePlanFlow.tsx", projectUrl), "utf8");
  assert.match(flow, /setPurchase\(current\.data\); setC2pAttempted/);
  assert.match(flow, /Tienes una compra pendiente/);
  assert.match(flow, /Continuar compra/);
  assert.match(flow, /onClick=\{resumePurchase\}/);
});
