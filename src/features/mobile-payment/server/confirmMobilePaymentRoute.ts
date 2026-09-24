import "server-only";

import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";

import { isUuid } from "../contractValidation";
import {
  assertMobilePaymentAccessWithCore,
  confirmMobilePaymentWithCore,
} from "./coreMobilePayment";
import {
  mobilePaymentOperationResponse,
  runAuthenticatedMobilePaymentOperation,
} from "./mobilePaymentRoute";

export async function handleConfirmMobilePayment(
  request: NextRequest,
  operationId: string,
) {
  if (!isUuid(operationId)) {
    return authJson({ error: "invalid_request" }, 400);
  }

  return runAuthenticatedMobilePaymentOperation(
    request,
    async (accessToken, signal) => {
      await assertMobilePaymentAccessWithCore(accessToken, signal);
      const confirmation = await confirmMobilePaymentWithCore(
        accessToken,
        operationId,
        signal,
      );

      return mobilePaymentOperationResponse(
        confirmation,
        confirmation.isPending ? 202 : 200,
      );
    },
  );
}
