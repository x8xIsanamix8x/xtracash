import type { PaymentReportSupport } from "../types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32_768;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

export async function encodePaymentSupportFile(
  file: File,
  signal: AbortSignal,
): Promise<PaymentReportSupport> {
  const content = await file.arrayBuffer();
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");

  return {
    fileName: file.name,
    contentBase64: arrayBufferToBase64(content),
  };
}
