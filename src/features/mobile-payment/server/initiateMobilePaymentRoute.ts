import "server-only";

import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";

import {
  assertMobilePaymentAccessWithCore,
  initiateMobilePaymentWithCore,
} from "./coreMobilePayment";
import { runAuthenticatedMobilePaymentOperation } from "./mobilePaymentRoute";
import { parseInitiatePaymentRequest } from "./requestValidation";

export async function handleInitiateMobilePayment(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJson({ error: "invalid_request" }, 400);
  }

  const paymentRequest = parseInitiatePaymentRequest(body);
  if (paymentRequest === null) {
    return authJson({ error: "invalid_request" }, 400);
  }

  return runAuthenticatedMobilePaymentOperation(
    request,
    async (accessToken, signal) => {
      await assertMobilePaymentAccessWithCore(accessToken, signal);
      return initiateMobilePaymentWithCore(
        accessToken,
        paymentRequest,
        signal,
      );
    },
  );
}
