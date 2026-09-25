import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { isUuid } from "@/features/installments/contractValidation";
import { getPaymentDataFromCore } from "@/features/installments/server/coreInstallments";
import { runAuthenticatedInstallmentsOperation } from "@/features/installments/server/installmentsRoute";
import { parsePaymentDateQuery } from "@/features/installments/server/requestValidation";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/installments/[consumptionId]/payment-data">,
) {
  const { consumptionId } = await context.params;
  if (!isUuid(consumptionId)) {
    return authJson({ error: "consumption_not_found" }, 404);
  }

  const paymentDate = parsePaymentDateQuery(
    request.nextUrl.searchParams.get("paymentDate"),
  );
  if (!paymentDate.ok) {
    return authJson({ error: "invalid_request" }, 400);
  }

  return runAuthenticatedInstallmentsOperation(
    request,
    (accessToken, signal) => getPaymentDataFromCore(
      accessToken,
      consumptionId,
      paymentDate.value,
      signal,
    ),
  );
}
