import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { createPaymentReportInCore } from "@/features/payment-report/server/corePaymentReport";
import { runAuthenticatedPaymentReportOperation } from "@/features/payment-report/server/paymentReportRoute";
import { parseCreatePaymentReportRequest } from "@/features/payment-report/server/requestValidation";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJson({ error: "invalid_request" }, 400);
  }

  const report = parseCreatePaymentReportRequest(body);
  if (report === null) {
    return authJson({ error: "invalid_request" }, 400);
  }

  return runAuthenticatedPaymentReportOperation(
    request,
    (accessToken, signal) => createPaymentReportInCore(
      accessToken,
      report,
      signal,
    ),
  );
}
