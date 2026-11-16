const PRODUCT_IMAGE_PATH = /\/api\/impulsate-movil\/catalogo\/([0-9a-f-]{36})\/imagenes\/([0-9a-f-]{36})\/?$/i;

/**
 * Convierte la ruta privada de imágenes de Core a su proxy autenticado local.
 * Las URLs públicas de almacenamiento siguen siendo servidas desde su origen.
 */
export function getMarketplaceImageSource(url: string | undefined, productId: string): string | null {
  if (!url) return null;
  let pathname: string;
  try {
    pathname = new URL(url, "https://marketplace.invalid").pathname;
  } catch {
    return null;
  }
  const match = pathname.match(PRODUCT_IMAGE_PATH);
  if (!match) return url;
  const [, urlProductId, imageId] = match;
  if (urlProductId.toLowerCase() !== productId.toLowerCase()) return null;
  return `/api/marketplace/catalogo/${encodeURIComponent(productId)}/imagenes/${encodeURIComponent(imageId)}`;
}
