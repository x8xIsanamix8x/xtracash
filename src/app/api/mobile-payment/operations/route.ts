import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { initiateMobilePaymentWithCore } from "@/features/mobile-payment/server/coreMobilePayment";
import { runAuthenticatedMobilePaymentOperation } from "@/features/mobile-payment/server/mobilePaymentRoute";
import { parseInitiatePaymentRequest } from "@/features/mobile-payment/server/requestValidation";

export async function POST(request: NextRequest) {
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
    (accessToken, signal) => initiateMobilePaymentWithCore(
      accessToken,
      paymentRequest,
      signal,
    ),
  );
}
