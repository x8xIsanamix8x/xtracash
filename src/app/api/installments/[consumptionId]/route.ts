import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { isUuid } from "@/features/installments/contractValidation";
import { getConsumptionDetailFromCore } from "@/features/installments/server/coreInstallments";
import { runAuthenticatedInstallmentsOperation } from "@/features/installments/server/installmentsRoute";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/installments/[consumptionId]">,
) {
  const { consumptionId } = await context.params;
  if (!isUuid(consumptionId)) {
    return authJson({ error: "consumption_not_found" }, 404);
  }

  return runAuthenticatedInstallmentsOperation(
    request,
    (accessToken, signal) => getConsumptionDetailFromCore(accessToken, consumptionId, signal),
  );
}
