import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import {
  isNonEmptyString,
  isRecord,
  isUuid,
} from "../contractValidation";
import { buildCoreInitiatePaymentRequest } from "../coreInitiatePaymentRequest";
import type {
  Bank,
  ConfirmedPayment,
  DirectoryContact,
  InitiatePaymentRequest,
  InitiatedPayment,
  MobilePaymentAccessStatus,
  MobilePaymentContext,
  MobilePaymentOptions,
} from "../types";
import { parseCoreConfirmedPayment } from "./coreConfirmedPaymentValidation";
import { parseCoreInitiatedPayment } from "./coreInitiatedPaymentValidation";
import {
  parseCoreMobilePaymentBalance,
  parseCoreMobilePaymentSummary,
} from "./coreMobilePaymentContextValidation";

export type CoreMobilePaymentErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

export class CoreMobilePaymentError extends Error {
  readonly type: CoreMobilePaymentErrorType;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(
    type: CoreMobilePaymentErrorType,
    status: number | null = null,
    detail: string | null = null,
  ) {
    super(type);
    this.name = "CoreMobilePaymentError";
    this.type = type;
    this.status = status;
    this.detail = detail;
  }
}

export class MobilePaymentAccessRestrictedError extends Error {
  readonly accessStatus: Exclude<MobilePaymentAccessStatus, "active">;

  constructor(accessStatus: Exclude<MobilePaymentAccessStatus, "active">) {
    super(accessStatus);
    this.name = "MobilePaymentAccessRestrictedError";
    this.accessStatus = accessStatus;
  }
}

type CoreRequestOptions = Readonly<{
  accessToken?: string;
  body?: unknown;
  method?: "GET" | "POST" | "DELETE";
  signal: AbortSignal;
}>;

function getCoreEndpoint(pathname: string): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new CoreMobilePaymentError("configuration");
  return `${configuration.baseUrl}${pathname}`;
}

async function readCoreErrorDetail(response: Response): Promise<string | null> {
  try {
    const value: unknown = await response.json();
    if (!isRecord(value)) return null;

    for (const field of ["mensaje", "message", "detail", "detalle"]) {
      const candidate = value[field];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim().slice(0, 300);
      }
    }
  } catch {
    // A malformed Core error keeps the safe generic message.
  }

  return null;
}

async function requestCore(
  pathname: string,
  { accessToken, body, method = "GET", signal }: CoreRequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(getCoreEndpoint(pathname), {
      method,
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new CoreMobilePaymentError(
        "http",
        response.status,
        await readCoreErrorDetail(response),
      );
    }

    return response;
  } catch (error) {
    if (error instanceof CoreMobilePaymentError) throw error;
    throw new CoreMobilePaymentError("network");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CoreMobilePaymentError("protocol");
  }
}

function parseBanks(value: unknown): readonly Bank[] | null {
  if (!Array.isArray(value)) return null;

  const banks = value.map((candidate): Bank | null => {
    if (
      !isRecord(candidate)
      || !isNonEmptyString(candidate.code)
      || !isNonEmptyString(candidate.name)
    ) {
      return null;
    }

    return { code: candidate.code.trim(), name: candidate.name.trim() };
  });

  return banks.some((bank) => bank === null)
    ? null
    : banks as readonly Bank[];
}

function parseDirectory(value: unknown): readonly DirectoryContact[] | null {
  if (!Array.isArray(value)) return null;

  const contacts = value.map((candidate): DirectoryContact | null => {
    if (
      !isRecord(candidate)
      || !isUuid(candidate.entryId)
      || !isNonEmptyString(candidate.name)
      || (candidate.documentType !== "V" && candidate.documentType !== "J")
      || !isNonEmptyString(candidate.documentNumber)
      || !isNonEmptyString(candidate.bankCode)
      || !isNonEmptyString(candidate.phone)
    ) {
      return null;
    }

    return {
      id: candidate.entryId,
      name: candidate.name.trim(),
      documentType: candidate.documentType,
      documentNumber: candidate.documentNumber.trim(),
      bankCode: candidate.bankCode.trim(),
      phone: candidate.phone.trim(),
    };
  });

  return contacts.some((contact) => contact === null)
    ? null
    : contacts as readonly DirectoryContact[];
}

export async function getMobilePaymentOptionsFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<MobilePaymentOptions> {
  const [banksResponse, directoryResponse] = await Promise.all([
    requestCore("/api/directorio-bancos", { signal }),
    requestCore("/api/directorio-pagos", { accessToken, signal }),
  ]);
  const [banksBody, directoryBody] = await Promise.all([
    readJson(banksResponse),
    readJson(directoryResponse),
  ]);
  const banks = parseBanks(banksBody);
  const contacts = parseDirectory(directoryBody);

  if (banks === null || contacts === null) {
    throw new CoreMobilePaymentError("protocol");
  }

  return { banks, contacts };
}

export async function getMobilePaymentAccessStatusFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<MobilePaymentAccessStatus> {
  const response = await requestCore("/api/impulsate-movil/resumen", {
    accessToken,
    signal,
  });
  const summary = parseCoreMobilePaymentSummary(await readJson(response));

  if (summary === null) throw new CoreMobilePaymentError("protocol");
  return summary.accessStatus;
}

export async function getMobilePaymentContextFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<MobilePaymentContext> {
  const [options, balanceResponse, summaryResponse] = await Promise.all([
    getMobilePaymentOptionsFromCore(accessToken, signal),
    requestCore("/api/impulsate-movil/balance", { accessToken, signal }),
    requestCore("/api/impulsate-movil/resumen", { accessToken, signal }),
  ]);
  const [balanceBody, summaryBody] = await Promise.all([
    readJson(balanceResponse),
    readJson(summaryResponse),
  ]);
  const balance = parseCoreMobilePaymentBalance(balanceBody);
  const summary = parseCoreMobilePaymentSummary(summaryBody);

  if (balance === null || summary === null) {
    throw new CoreMobilePaymentError("protocol");
  }

  return {
    ...options,
    availableBs: balance.availableBs,
    accessStatus: summary.accessStatus,
  };
}

export async function assertMobilePaymentAccessWithCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<void> {
  const accessStatus = await getMobilePaymentAccessStatusFromCore(
    accessToken,
    signal,
  );

  if (accessStatus !== "active") {
    throw new MobilePaymentAccessRestrictedError(accessStatus);
  }
}

export async function initiateMobilePaymentWithCore(
  accessToken: string,
  request: InitiatePaymentRequest,
  signal: AbortSignal,
): Promise<InitiatedPayment> {
  const response = await requestCore("/api/pagos-salientes", {
    accessToken,
    method: "POST",
    body: buildCoreInitiatePaymentRequest(request),
    signal,
  });
  const result = parseCoreInitiatedPayment(
    await readJson(response),
    request.recipient,
    request.iconId,
  );
  if (result === null) throw new CoreMobilePaymentError("protocol");
  return result;
}

export async function confirmMobilePaymentWithCore(
  accessToken: string,
  operationId: string,
  signal: AbortSignal,
): Promise<ConfirmedPayment> {
  const response = await requestCore(
    `/api/pagos-salientes/${encodeURIComponent(operationId)}/confirmacion`,
    { accessToken, method: "POST", signal },
  );
  const result = parseCoreConfirmedPayment(
    await readJson(response),
    response.status === 202,
  );
  if (result === null) throw new CoreMobilePaymentError("protocol");
  return result;
}

export async function deleteDirectoryContactFromCore(
  accessToken: string,
  entryId: string,
  signal: AbortSignal,
): Promise<void> {
  await requestCore(`/api/directorio-pagos/${encodeURIComponent(entryId)}`, {
    accessToken,
    method: "DELETE",
    signal,
  });
}
