import { MarketplaceProductView } from "@/features/marketplace/MarketplaceProductView";

export default async function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <MarketplaceProductView productId={productId} />;
}
