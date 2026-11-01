import { MarketplacePurchaseDetailView } from "@/features/marketplace";

export default async function MarketplacePurchaseDetailPage({
  params,
}: {
  params: Promise<{ compraId: string }>;
}) {
  const { compraId } = await params;
  return <MarketplacePurchaseDetailView purchaseId={compraId} />;
}
