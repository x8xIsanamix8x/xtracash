import { notFound } from "next/navigation";

import { PaymentInstructionsView } from "@/features/installments";
import { isUuid } from "@/features/installments/contractValidation";
import { parsePaymentSelectionQuery } from "@/features/installments/paymentOptions";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentInstructionsPage(
  props: PageProps<"/installments/[consumptionId]/payment">,
) {
  const [{ consumptionId }, searchParams] = await Promise.all([props.params, props.searchParams]);
  if (!isUuid(consumptionId)) notFound();

  return (
    <PaymentInstructionsView
      consumptionId={consumptionId}
      key={consumptionId}
      requestedSelection={parsePaymentSelectionQuery(
        firstValue(searchParams.option),
        firstValue(searchParams.count),
      )}
    />
  );
}
