import type { NextRequest } from "next/server";

import { handleInitiateMobilePayment } from "@/features/mobile-payment/server/initiateMobilePaymentRoute";

export async function POST(request: NextRequest) {
  return handleInitiateMobilePayment(request);
}
