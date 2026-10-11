import assert from "node:assert/strict";
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
