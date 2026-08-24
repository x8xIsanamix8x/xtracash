import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import {
  isNonEmptyString,
  isRecord,
} from "../contractValidation";
import type {
  CreatePaymentReportRequest,
  PaymentReportData,
  PaymentReportResult,
  SourceBank,
} from "../types";
import {
  normalizeCoreMoney,
  parseCorePaymentReportResponse,
} from "./corePaymentReportResponse";
import type { CorePaymentReportConflict } from "./corePaymentReportResponse";
import { toCoreAmountNumber } from "./requestValidation";

export type CorePaymentReportErrorType =
  | "configuration"
  | "http"
  | "network"
  | "not_configured"
  | "protocol";

export class CorePaymentReportError extends Error {
  readonly type: CorePaymentReportErrorType;
  readonly status: number | null;
  readonly conflict: CorePaymentReportConflict | null;

  constructor(
    type: CorePaymentReportErrorType,
    status: number | null = null,
    conflict: CorePaymentReportConflict | null = null,
  ) {
    super(type);
    this.name = "CorePaymentReportError";
    this.type = type;
    this.status = status;
    this.conflict = conflict;
  }
}

type CoreRequestOptions = Readonly<{
  accessToken?: string;
  body?: unknown;
  method?: "GET" | "POST";
  signal: AbortSignal;
}>;

function getCoreEndpoint(pathname: string): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new CorePaymentReportError("configuration");
  return `${configuration.baseUrl}${pathname}`;
}

async function requestCore(
  pathname: string,
  { accessToken, body, method = "GET", signal }: CoreRequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    return await fetch(getCoreEndpoint(pathname), {
      method,
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof CorePaymentReportError) throw error;
    throw new CorePaymentReportError("network");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CorePaymentReportError("protocol");
  }
}

function readMoney(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return normalizeCoreMoney(value.bs);
}

function parsePaymentData(value: unknown): Omit<PaymentReportData, "sourceBanks"> | null {
  if (!isRecord(value) || !isRecord(value.deuda)) return null;

  const currentBs = readMoney(value.deuda.actual);
  const minimumBs = readMoney(value.deuda.minima);
  if (
    !isNonEmptyString(value.banco)
    || typeof value.codigoBanco !== "string"
    || !/^\d{4}$/.test(value.codigoBanco)
    || !isNonEmptyString(value.rif)
    || !isNonEmptyString(value.telefono)
    || currentBs === null
    || minimumBs === null
  ) {
    return null;
  }

  return {
    destination: {
      bankName: value.banco.trim(),
      bankCode: value.codigoBanco,
      rif: value.rif.trim(),
      receiverPhone: value.telefono.trim(),
    },
    debt: { currentBs, minimumBs },
  };
}

function parseBanks(value: unknown): readonly SourceBank[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const banks = value.map((candidate): SourceBank | null => {
    if (
      !isRecord(candidate)
      || typeof candidate.code !== "string"
      || !/^\d{4}$/.test(candidate.code)
      || !isNonEmptyString(candidate.name)
    ) {
      return null;
    }
    return { code: candidate.code, name: candidate.name.trim() };
  });

  return banks.some((bank) => bank === null)
    ? null
    : banks as readonly SourceBank[];
}

export async function getPaymentReportDataFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<PaymentReportData> {
  const dataResponse = await requestCore(
    "/api/impulsate-movil/datos-pago",
    { accessToken, signal },
  );

  if (dataResponse.status === 404) {
    throw new CorePaymentReportError("not_configured", 404);
  }
  if (dataResponse.status !== 200) {
    throw new CorePaymentReportError("http", dataResponse.status);
  }

  const banksResponse = await requestCore("/api/directorio-bancos", { signal });
  if (banksResponse.status !== 200) {
    throw new CorePaymentReportError("http", banksResponse.status);
  }

  const [dataBody, banksBody] = await Promise.all([
    readJson(dataResponse),
    readJson(banksResponse),
  ]);
  const data = parsePaymentData(dataBody);
  const sourceBanks = parseBanks(banksBody);
  if (data === null || sourceBanks === null) {
    throw new CorePaymentReportError("protocol");
  }

  return { ...data, sourceBanks };
}

export async function createPaymentReportInCore(
  accessToken: string,
  report: CreatePaymentReportRequest,
  signal: AbortSignal,
): Promise<PaymentReportResult> {
  const response = await requestCore("/api/impulsate-movil/reportes-pago", {
    accessToken,
    method: "POST",
    body: {
      montoBs: toCoreAmountNumber(report.amountBs),
      bancoEmisor: report.originBankCode,
      telefonoEmisor: report.senderPhone,
      fechaPago: report.paymentDate,
      referenciaBancaria: report.bankReference,
    },
    signal,
  });

  const result = await parseCorePaymentReportResponse(response);
  if (result.ok) return result.value;
  if (result.type === "conflict") {
    throw new CorePaymentReportError("http", 409, result.conflict);
  }
  if (result.type === "http") {
    throw new CorePaymentReportError("http", result.status);
  }
  throw new CorePaymentReportError("protocol");
}
