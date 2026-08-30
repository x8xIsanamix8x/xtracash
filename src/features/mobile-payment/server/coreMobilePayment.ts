import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import {
  isNonEmptyString,
  isRecord,
  isUuid,
} from "../contractValidation";
import type {
  Bank,
  ConfirmedPayment,
  DirectoryContact,
  InitiatePaymentRequest,
  InitiatedPayment,
  MobilePaymentOptions,
  ResolvedRecipient,
} from "../types";
import {
  parseCoreConfirmedPayment,
  readCoreMoney,
} from "./coreConfirmedPaymentValidation";

export type CoreMobilePaymentErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

export class CoreMobilePaymentError extends Error {
  readonly type: CoreMobilePaymentErrorType;
  readonly status: number | null;

  constructor(type: CoreMobilePaymentErrorType, status: number | null = null) {
    super(type);
    this.name = "CoreMobilePaymentError";
    this.type = type;
    this.status = status;
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
      throw new CoreMobilePaymentError("http", response.status);
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

function parseCoreRecipient(
  value: unknown,
  requestRecipient: ResolvedRecipient,
): ResolvedRecipient | null {
  if (!isRecord(value) || !isRecord(value.banco)) return null;
  if (
    !isNonEmptyString(value.nombre)
    || !isNonEmptyString(value.banco.codigo)
    || !isNonEmptyString(value.telefono)
    || (value.nacionalidad !== "V" && value.nacionalidad !== "J")
    || !isNonEmptyString(value.documento)
  ) {
    return null;
  }

  return {
    id: requestRecipient.id,
    name: value.nombre.trim(),
    bankCode: value.banco.codigo.trim(),
    documentType: value.nacionalidad,
    documentNumber: value.documento.trim(),
    phone: value.telefono.trim(),
    saveToDirectory: requestRecipient.saveToDirectory,
  };
}

function parseInitiatedResponse(
  value: unknown,
  requestRecipient: ResolvedRecipient,
): InitiatedPayment | null {
  if (
    !isRecord(value)
    || !isRecord(value.comision)
    || !isRecord(value.tasa)
    || !isRecord(value.data)
  ) {
    return null;
  }

  const amountBs = readCoreMoney(value.monto);
  const feeBs = readCoreMoney(value.comision);
  const totalBs = readCoreMoney(value.total);
  const availableBs = readCoreMoney(value.data.disponible);
  const recipient = parseCoreRecipient(value.data.beneficiario, requestRecipient);

  if (
    !isUuid(value.operacionId)
    || !isNonEmptyString(value.estado)
    || (value.canal !== "MISMO_BANCO" && value.canal !== "OTRA_ENTIDAD")
    || amountBs === null
    || feeBs === null
    || totalBs === null
    || availableBs === null
    || !isNonEmptyString(value.comision.porcentaje)
    || !isNonEmptyString(value.tasa.valor)
    || !isNonEmptyString(value.tasa.fecha)
    || !isNonEmptyString(value.tasa.fuente)
    || !isNonEmptyString(value.expiraEn)
    || Number.isNaN(Date.parse(value.expiraEn))
    || recipient === null
  ) {
    return null;
  }

  return {
    operationId: value.operacionId,
    status: value.estado.trim(),
    channel: value.canal,
    amountBs,
    feeBs,
    feePercentage: value.comision.porcentaje.trim(),
    totalBs,
    rateValue: value.tasa.valor.trim(),
    rateDate: value.tasa.fecha.trim(),
    rateSource: value.tasa.fuente.trim(),
    expiresAt: value.expiraEn,
    availableBs,
    recipient,
  };
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

export async function initiateMobilePaymentWithCore(
  accessToken: string,
  request: InitiatePaymentRequest,
  signal: AbortSignal,
): Promise<InitiatedPayment> {
  const beneficiary = request.recipient.id
    ? { beneficiarioId: request.recipient.id }
    : {
        beneficiarioNuevo: {
          name: request.recipient.name,
          documentType: request.recipient.documentType,
          documentNumber: request.recipient.documentNumber,
          bankCode: request.recipient.bankCode,
          phone: request.recipient.phone,
          guardarEnDirectorio: request.recipient.saveToDirectory,
        },
      };
  const response = await requestCore("/api/pagos-salientes", {
    accessToken,
    method: "POST",
    body: {
      ...beneficiary,
      montoBs: request.amountMinorUnits / 100,
    },
    signal,
  });
  const result = parseInitiatedResponse(await readJson(response), request.recipient);
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
  const result = parseCoreConfirmedPayment(await readJson(response));
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
