import { notFound } from "next/navigation";

import { ConsumptionDetailView } from "@/features/installments";
import { isUuid } from "@/features/installments/contractValidation";

export default async function MarketplaceConsumptionDetailPage(
  props: Readonly<{ params: Promise<{ consumptionId: string }> }>,
) {
  const { consumptionId } = await props.params;
  if (!isUuid(consumptionId)) notFound();

  return <ConsumptionDetailView consumptionId={consumptionId} variant="marketplace" key={consumptionId} />;
}
