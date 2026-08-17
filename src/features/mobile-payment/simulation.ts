import { mobilePaymentMock } from "./mocks/mobilePayment";
import type { TransferRequest, TransferResult } from "./types";

export function simulateMobilePayment(
  request: TransferRequest,
  signal: AbortSignal,
): Promise<TransferResult> {
  return new Promise((resolve, reject) => {
    const abortRequest = () => {
      window.clearTimeout(timer);
      reject(new DOMException("La simulación fue cancelada.", "AbortError"));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abortRequest);
      const status = mobilePaymentMock.transferResultStatus;

      resolve({
        ...request,
        status,
        transactionDate: new Date().toISOString(),
        ...(status === "success" || status === "processing"
          ? { bankReference: mobilePaymentMock.transferReference }
          : {}),
        ...(status === "rejected"
          ? {
            userMessage:
              "Revisa los datos de la operación antes de intentarlo nuevamente.",
          }
          : {}),
      });
    }, mobilePaymentMock.transferDelay);

    signal.addEventListener("abort", abortRequest, { once: true });

    if (signal.aborted) {
      abortRequest();
    }
  });
}
