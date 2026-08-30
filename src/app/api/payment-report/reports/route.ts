import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { createPaymentReportInCore } from "@/features/payment-report/server/corePaymentReport";
import { runAuthenticatedPaymentReportOperation } from "@/features/payment-report/server/paymentReportRoute";
import { validateCreatePaymentReportRequest } from "@/features/payment-report/server/requestValidation";
import { MAX_PAYMENT_REPORT_JSON_BYTES } from "@/features/payment-report/paymentSupport";

type ReadRequestResult =
  | Readonly<{ body: unknown; ok: true }>
  | Readonly<{ error: "invalid_request" | "payment_support_too_large"; ok: false }>;

async function readRequest(request: NextRequest): Promise<ReadRequestResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/u.test(contentLength)) {
    const declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes > MAX_PAYMENT_REPORT_JSON_BYTES) {
      return { ok: false, error: "payment_support_too_large" };
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, error: "invalid_request" };
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYMENT_REPORT_JSON_BYTES) {
    return { ok: false, error: "payment_support_too_large" };
  }

  try {
    return { ok: true, body: JSON.parse(rawBody) as unknown };
  } catch {
    return { ok: false, error: "invalid_request" };
  }
}

export async function POST(request: NextRequest) {
  const requestResult = await readRequest(request);
  if (!requestResult.ok) {
    return authJson(
      { error: requestResult.error },
      requestResult.error === "payment_support_too_large" ? 413 : 400,
    );
  }

  const validation = validateCreatePaymentReportRequest(requestResult.body);
  if (!validation.ok) {
    return authJson(
      { error: validation.error },
      validation.error === "payment_support_too_large" ? 413 : 400,
    );
  }

  return runAuthenticatedPaymentReportOperation(
    request,
    (accessToken, signal) => createPaymentReportInCore(
      accessToken,
      validation.value,
      signal,
    ),
  );
}
