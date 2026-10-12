import { MarketplaceProductView } from "@/features/marketplace/MarketplaceProductView";
import { findMarketplaceProduct } from "@/features/marketplace/products";

export default async function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <MarketplaceProductView product={findMarketplaceProduct(productId)} />;
}
