import { MarketplaceProductView } from "@/features/marketplace/MarketplaceProductView";

export default async function MarketplaceProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ compraId?: string | string[] }>;
}) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const resumePurchaseId = typeof query.compraId === "string" && /^[0-9a-f-]{36}$/i.test(query.compraId) ? query.compraId : undefined;
  return <MarketplaceProductView productId={productId} resumePurchaseId={resumePurchaseId} />;
}
