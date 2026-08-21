import type { NextRequest } from "next/server";

import { getMobilePaymentOptionsFromCore } from "@/features/mobile-payment/server/coreMobilePayment";
import { runAuthenticatedMobilePaymentOperation } from "@/features/mobile-payment/server/mobilePaymentRoute";

export async function GET(request: NextRequest) {
  return runAuthenticatedMobilePaymentOperation(
    request,
    (accessToken, signal) => getMobilePaymentOptionsFromCore(accessToken, signal),
  );
}
