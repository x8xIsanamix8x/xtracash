import type { NextRequest } from "next/server";

import { getSourceBanksFromCore } from "@/features/installments/server/coreInstallments";
import { runAuthenticatedInstallmentsOperation } from "@/features/installments/server/installmentsRoute";

export async function GET(request: NextRequest) {
  return runAuthenticatedInstallmentsOperation(
    request,
    (accessToken, signal) => getSourceBanksFromCore(accessToken, signal),
  );
}
