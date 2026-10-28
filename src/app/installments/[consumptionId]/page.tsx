import { notFound } from "next/navigation";

import { ConsumptionDetailView } from "@/features/installments";
import { isUuid } from "@/features/installments/contractValidation";

export default async function ConsumptionDetailPage(
  props: PageProps<"/installments/[consumptionId]">,
) {
  const { consumptionId } = await props.params;
  if (!isUuid(consumptionId)) notFound();

  // `key` reinicia la vista al pasar de un consumo a otro.
  return <ConsumptionDetailView consumptionId={consumptionId} key={consumptionId} />;
}
