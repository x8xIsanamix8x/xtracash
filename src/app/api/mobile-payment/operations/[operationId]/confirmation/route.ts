import type { NextRequest } from "next/server";

import { handleConfirmMobilePayment } from "@/features/mobile-payment/server/confirmMobilePaymentRoute";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/mobile-payment/operations/[operationId]/confirmation">,
) {
  const { operationId } = await context.params;
  return handleConfirmMobilePayment(request, operationId);
}
