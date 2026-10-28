import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { isUuid } from "@/features/installments/contractValidation";
import { createInstallmentReportInCore } from "@/features/installments/server/coreInstallments";
import { runAuthenticatedInstallmentsOperation } from "@/features/installments/server/installmentsRoute";
import { validateCreateInstallmentReportRequest } from "@/features/installments/server/requestValidation";
import { MAX_PAYMENT_REPORT_JSON_BYTES } from "@/features/installments/paymentSupport";

type ReadRequestResult =
  | Readonly<{ ok: true; body: unknown }>
  | Readonly<{ ok: false; error: "invalid_request" | "payment_support_too_large" }>;

async function readRequest(request: NextRequest): Promise<ReadRequestResult> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_PAYMENT_REPORT_JSON_BYTES) {
    return { ok: false, error: "payment_support_too_large" };
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

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/installments/[consumptionId]/reports">,
) {
  const { consumptionId } = await context.params;
  if (!isUuid(consumptionId)) {
    return authJson({ error: "consumption_not_found" }, 404);
  }

  const requestResult = await readRequest(request);
  const validation = requestResult.ok
    ? validateCreateInstallmentReportRequest(requestResult.body)
    : requestResult;
  if (!validation.ok) {
    return authJson(
      { error: validation.error },
      validation.error === "payment_support_too_large" ? 413 : 400,
    );
  }

  return runAuthenticatedInstallmentsOperation(
    request,
    (accessToken, signal) => createInstallmentReportInCore(
      accessToken,
      consumptionId,
      validation.value,
      signal,
    ),
    201,
  );
}
