import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { isUuid } from "@/features/mobile-payment/contractValidation";
import { confirmMobilePaymentWithCore } from "@/features/mobile-payment/server/coreMobilePayment";
import { runAuthenticatedMobilePaymentOperation } from "@/features/mobile-payment/server/mobilePaymentRoute";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/mobile-payment/operations/[operationId]/confirmation">,
) {
  const { operationId } = await context.params;
  if (!isUuid(operationId)) {
    return authJson({ error: "invalid_request" }, 400);
  }

  return runAuthenticatedMobilePaymentOperation(
    request,
    (accessToken, signal) => confirmMobilePaymentWithCore(
      accessToken,
      operationId,
      signal,
    ),
  );
}
