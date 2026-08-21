import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { isUuid } from "@/features/mobile-payment/contractValidation";
import { deleteDirectoryContactFromCore } from "@/features/mobile-payment/server/coreMobilePayment";
import { runAuthenticatedMobilePaymentOperation } from "@/features/mobile-payment/server/mobilePaymentRoute";

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/mobile-payment/directory/[entryId]">,
) {
  const { entryId } = await context.params;
  if (!isUuid(entryId)) {
    return authJson({ error: "invalid_request" }, 400);
  }

  return runAuthenticatedMobilePaymentOperation(request, async (accessToken, signal) => {
    await deleteDirectoryContactFromCore(accessToken, entryId, signal);
    return { ok: true };
  });
}
