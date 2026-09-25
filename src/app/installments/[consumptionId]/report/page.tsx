import { notFound } from "next/navigation";

import { PaymentReportView } from "@/features/installments";
import { isUuid } from "@/features/installments/contractValidation";
import {
  parsePaymentOrigin,
  parsePaymentSelectionQuery,
} from "@/features/installments/paymentOptions";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentReportPage(
  props: PageProps<"/installments/[consumptionId]/report">,
) {
  const [{ consumptionId }, searchParams] = await Promise.all([props.params, props.searchParams]);
  if (!isUuid(consumptionId)) notFound();

  return (
    <PaymentReportView
      consumptionId={consumptionId}
      key={consumptionId}
      origin={parsePaymentOrigin(firstValue(searchParams.from))}
      requestedSelection={parsePaymentSelectionQuery(
        firstValue(searchParams.option),
        firstValue(searchParams.count),
      )}
    />
  );
}
