import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  findMarketplaceProduct,
  marketplaceProducts,
} from "../../src/features/marketplace/products.ts";

test("el catálogo de muestra incluye equipos UVU y permite consultar cada producto", () => {
  assert.equal(marketplaceProducts.length, 4);
  assert.equal(findMarketplaceProduct("kit-solar-3kw")?.name, "Equipos de 3 KW");
  assert.equal(findMarketplaceProduct("kit-solar-3kw")?.price, "$1.500");
  assert.equal(findMarketplaceProduct("unknown"), undefined);
  assert.ok(marketplaceProducts.every((product) => product.description.includes("UVU Energy")));
});

test("el plan de compra simula métodos de pago y el reporte sin llamar servicios", async () => {
  const flow = await readFile(new URL("../../src/features/marketplace/components/PurchasePlanFlow.tsx", import.meta.url), "utf8");

  assert.match(flow, /Plan de compra/);
  assert.match(flow, /Pago móvil/);
  assert.match(flow, /Transferencia/);
  assert.match(flow, /Listo - Ya pagué/);
  assert.match(flow, /Reporta el pago/);
  assert.match(flow, /¡Pago reportado!/);
  assert.doesNotMatch(flow, /fetch\(/);
});
