import type { NextRequest } from "next/server";

import { getPaymentReportDataFromCore } from "@/features/payment-report/server/corePaymentReport";
import { runAuthenticatedPaymentReportOperation } from "@/features/payment-report/server/paymentReportRoute";

export async function GET(request: NextRequest) {
  return runAuthenticatedPaymentReportOperation(
    request,
    (accessToken, signal) => getPaymentReportDataFromCore(accessToken, signal),
  );
}
