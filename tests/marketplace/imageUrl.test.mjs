import test from "node:test";
import assert from "node:assert/strict";
import { getMarketplaceImageSource } from "../../src/features/marketplace/imageUrl.ts";

const productId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e71";
const imageId = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e72";
const corePath = `/api/impulsate-movil/catalogo/${productId}/imagenes/${imageId}`;

test("envía las URLs privadas de Core por el proxy autenticado local", () => {
  assert.equal(getMarketplaceImageSource(corePath, productId), `/api/marketplace/catalogo/${productId}/imagenes/${imageId}`);
  assert.equal(getMarketplaceImageSource(`https://core-api.sandbox.impulsa.vc${corePath}`, productId), `/api/marketplace/catalogo/${productId}/imagenes/${imageId}`);
});

test("no permite asociar una imagen Core a un producto distinto", () => {
  assert.equal(getMarketplaceImageSource(corePath, "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e73"), null);
});

test("conserva URLs públicas de almacenamiento y tolera valores ausentes", () => {
  assert.equal(getMarketplaceImageSource("https://cdn.example.com/product.jpg", productId), "https://cdn.example.com/product.jpg");
  assert.equal(getMarketplaceImageSource(undefined, productId), null);
});
