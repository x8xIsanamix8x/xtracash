import {
  parseConfirmedPayment,
  parseInitiatedPayment,
  parseMobilePaymentContext,
  parseMobilePaymentOptions,
  parseMobilePaymentRestriction,
} from "../contractValidation";
import { buildCoreInitiatePaymentRequest } from "../coreInitiatePaymentRequest";
import type {
  ConfirmedPayment,
  InitiatePaymentRequest,
  InitiatedPayment,
  MobilePaymentContext,
  MobilePaymentAccessStatus,
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
  readonly accessStatus: MobilePaymentAccessStatus | null;
  readonly detail: string | null;

  constructor(
    type: MobilePaymentServiceErrorType,
    accessStatus: MobilePaymentAccessStatus | null = null,
    detail: string | null = null,
  ) {
    super(type);
    this.name = "MobilePaymentServiceError";
    this.type = type;
    this.accessStatus = accessStatus;
    this.detail = detail;
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

async function readServiceError(response: Response) {
  try {
    const body: unknown = await response.json();
    const detail = typeof body === "object"
      && body !== null
      && "message" in body
      && typeof body.message === "string"
      && body.message.trim()
      ? body.message.trim()
      : null;

    return {
      accessStatus: response.status === 403
        ? parseMobilePaymentRestriction(body)
        : null,
      detail,
    };
  } catch {
    return { accessStatus: null, detail: null };
  }
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
    const error = await readServiceError(response);
    throw new MobilePaymentServiceError(
      mapStatus(response.status),
      error.accessStatus,
      error.detail,
    );
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

export async function getMobilePaymentContext(
  signal: AbortSignal,
): Promise<MobilePaymentContext> {
  const response = await request("/api/mobile-payment/context", {}, signal);
  const context = parseMobilePaymentContext(await readJson(response));
  if (context === null) throw new MobilePaymentServiceError("invalid");
  return context;
}

export async function initiateMobilePayment(
  payment: InitiatePaymentRequest,
  signal: AbortSignal,
): Promise<InitiatedPayment> {
  const response = await request(
    "/api/pagos-salientes",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildCoreInitiatePaymentRequest(payment)),
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
    `/api/pagos-salientes/${encodeURIComponent(operationId)}/confirmacion`,
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
