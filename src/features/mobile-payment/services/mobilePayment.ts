import {
  parseConfirmedPayment,
  parseInitiatedPayment,
  parseMobilePaymentOptions,
} from "../contractValidation";
import type {
  ConfirmedPayment,
  InitiatePaymentRequest,
  InitiatedPayment,
  MobilePaymentOptions,
} from "../types";

export type MobilePaymentServiceErrorType =
  | "aborted"
  | "business"
  | "conflict"
  | "invalid"
  | "network"
  | "not_found"
  | "server"
  | "unauthenticated";

export class MobilePaymentServiceError extends Error {
  readonly type: MobilePaymentServiceErrorType;

  constructor(type: MobilePaymentServiceErrorType) {
    super(type);
    this.name = "MobilePaymentServiceError";
    this.type = type;
  }
}

function mapStatus(status: number): MobilePaymentServiceErrorType {
  if (status === 401) return "unauthenticated";
  if (status === 400) return "invalid";
  if (status === 403) return "business";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "business";
  return "server";
}

async function request(
  pathname: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(pathname, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new MobilePaymentServiceError("aborted");
    }
    throw new MobilePaymentServiceError("network");
  }

  if (!response.ok) {
    throw new MobilePaymentServiceError(mapStatus(response.status));
  }

  return response;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new MobilePaymentServiceError("invalid");
  }
}

export async function getMobilePaymentOptions(
  signal: AbortSignal,
): Promise<MobilePaymentOptions> {
  const response = await request("/api/mobile-payment/options", {}, signal);
  const options = parseMobilePaymentOptions(await readJson(response));
  if (options === null) throw new MobilePaymentServiceError("invalid");
  return options;
}

export async function initiateMobilePayment(
  payment: InitiatePaymentRequest,
  signal: AbortSignal,
): Promise<InitiatedPayment> {
  const response = await request(
    "/api/mobile-payment/operations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payment),
    },
    signal,
  );
  const result = parseInitiatedPayment(await readJson(response));
  if (result === null) throw new MobilePaymentServiceError("invalid");
  return result;
}

export async function confirmMobilePayment(
  operationId: string,
  signal: AbortSignal,
): Promise<ConfirmedPayment> {
  const response = await request(
    `/api/mobile-payment/operations/${encodeURIComponent(operationId)}/confirmation`,
    { method: "POST" },
    signal,
  );
  const result = parseConfirmedPayment(await readJson(response));
  if (result === null) throw new MobilePaymentServiceError("invalid");
  return result;
}

export async function deleteDirectoryContact(
  entryId: string,
  signal: AbortSignal,
): Promise<void> {
  await request(
    `/api/mobile-payment/directory/${encodeURIComponent(entryId)}`,
    { method: "DELETE" },
    signal,
  );
}
