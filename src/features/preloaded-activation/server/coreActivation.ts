import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";
import { getActivationHeaders } from "./activationHeaders";

export type ActivationApiErrorCode =
  | "API_KEY_INVALIDA"
  | "ACTIVACION_REALIZADA"
  | "DEMASIADOS_INTENTOS"
  | "DOCUMENTO_RECHAZADO"
  | "SIN_COINCIDENCIA"
  | "TOKEN_INVALIDO"
  | "ACTIVACION_SIN_ENVIAR";

export class CoreActivationError extends Error {
  constructor(
    readonly type: "configuration" | "network" | "http" | "protocol",
    readonly status?: number,
    readonly code?: string,
    readonly field?: string,
    readonly reason?: string,
  ) {
    super(type);
    this.name = "CoreActivationError";
  }
}

export type ActivationProfile = Readonly<{
  cedula: string;
  correo: string;
  nombre: string;
  apellido: string;
  telefono: string;
  estado: "VALIDADA" | "PENDIENTE_ACTIVACION";
  correoActivacion: "ENVIADO" | "FALLIDO" | null;
  token: string;
  tokenVenceEn: string;
}>;

export type ActivationSubmitResult = Readonly<{ correoActivacion: "ENVIADO" | "FALLIDO" }>;

function endpoint(path: string): string {
  const config = getServerCoreApiBaseUrl();
  if (!config.ok) throw new CoreActivationError("configuration");
  return `${config.baseUrl}/api/activacion-precargado${path}`;
}

async function callCore(path: string, init: RequestInit): Promise<Response> {
  const url = endpoint(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { ...getActivationHeaders(process.env.IDENTITY_PRELOADED_ACTIVATION_API_KEY), ...init.headers },
    });
  } catch {
    throw new CoreActivationError("network");
  }
  return response;
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  let body: unknown;
  try { body = await response.json(); } catch { throw new CoreActivationError("protocol", response.status); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new CoreActivationError("protocol", response.status);
  return body as Record<string, unknown>;
}

async function parseOptionalJson(response: Response): Promise<Record<string, unknown> | null> {
  let raw: string;
  try { raw = await response.text(); } catch { throw new CoreActivationError("protocol", response.status); }
  if (!raw.trim()) return null;
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new CoreActivationError("protocol", response.status); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new CoreActivationError("protocol", response.status);
  return body as Record<string, unknown>;
}

const knownErrorCodes = new Set([
  "API_KEY_INVALIDA",
  "ACTIVACION_REALIZADA",
  "ACTIVACION_SIN_ENVIAR",
  "CAMPO_NO_EDITABLE",
  "DEMASIADOS_INTENTOS",
  "DOCUMENTO_RECHAZADO",
  "SIN_COINCIDENCIA",
  "TOKEN_INVALIDO",
]);

function errorCode(body: Record<string, unknown>): string | undefined {
  const queue: unknown[] = [body];
  const visited = new Set<object>();
  while (queue.length > 0) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || Array.isArray(value) || visited.has(value)) continue;
    visited.add(value);
    const record = value as Record<string, unknown>;
    for (const key of ["codigo", "codigoError", "code", "errorCode", "codeError", "error", "message", "mensaje", "type"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && knownErrorCodes.has(candidate.trim().toUpperCase())) {
        return candidate.trim().toUpperCase();
      }
      if (candidate && typeof candidate === "object") queue.push(candidate);
    }
    for (const key of ["data", "details", "detalle", "cause", "causa"]) {
      if (record[key] && typeof record[key] === "object") queue.push(record[key]);
    }
  }
  return undefined;
}

function errorField(body: Record<string, unknown>): string | undefined {
  const queue: unknown[] = [body];
  const visited = new Set<object>();
  while (queue.length > 0) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || Array.isArray(value) || visited.has(value)) continue;
    visited.add(value);
    const record = value as Record<string, unknown>;
    const field = record.campo ?? record.field;
    if (field === "documentoCedula" || field === "documentoRif") return field;
    for (const key of ["data", "details", "detalle", "error"]) {
      if (record[key] && typeof record[key] === "object") queue.push(record[key]);
    }
  }
  return undefined;
}

function errorReason(body: Record<string, unknown>): string | undefined {
  const queue: unknown[] = [body];
  const visited = new Set<object>();
  const reasons = new Set(["VACIO", "MUY_GRANDE", "TIPO_NO_PERMITIDO"]);
  while (queue.length > 0) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || Array.isArray(value) || visited.has(value)) continue;
    visited.add(value);
    const record = value as Record<string, unknown>;
    const reason = record.motivo ?? record.reason;
    if (typeof reason === "string" && reasons.has(reason.toUpperCase())) return reason.toUpperCase();
    for (const key of ["data", "details", "detalle", "error"]) {
      if (record[key] && typeof record[key] === "object") queue.push(record[key]);
    }
  }
  return undefined;
}

function assertString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) throw new CoreActivationError("protocol");
  return value.trim();
}

export async function validatePreloadedIdentity(
  cedulaDigits: string,
  correo: string,
  signal?: AbortSignal,
): Promise<ActivationProfile> {
  const response = await callCore("/validar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cedula: `V${cedulaDigits}`, correo: correo.trim() }),
    signal,
  });
  const body = await parseJson(response);
  if (!response.ok) throw new CoreActivationError("http", response.status, errorCode(body));

  const estado = body.estado;
  const correoActivacion = body.correoActivacion;
  const tokenVenceEn = assertString(body, "tokenVenceEn");
  const expiry = Date.parse(tokenVenceEn);
  const token = assertString(body, "token");
  if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now() + 15 * 60 * 1000 + 60_000) {
    throw new CoreActivationError("protocol");
  }
  if (estado !== "VALIDADA" && estado !== "PENDIENTE_ACTIVACION") throw new CoreActivationError("protocol");
  if (correoActivacion !== null && correoActivacion !== "ENVIADO" && correoActivacion !== "FALLIDO") {
    throw new CoreActivationError("protocol");
  }

  return {
    cedula: assertString(body, "cedula"),
    correo: assertString(body, "correo"),
    nombre: assertString(body, "nombre"),
    apellido: assertString(body, "apellido"),
    telefono: assertString(body, "telefono"),
    estado,
    correoActivacion,
    token,
    tokenVenceEn,
  };
}

export async function submitPreloadedActivation(
  form: FormData,
  token: string,
  signal?: AbortSignal,
): Promise<{ result: ActivationSubmitResult; status: 201 | 202 }> {
  const upstream = new FormData();
  upstream.set("token", token);
  for (const field of ["nombre", "apellido", "telefono", "datosConfirmados", "terminosAceptados", "documentoCedula", "documentoRif"]) {
    const value = form.get(field);
    if (value === null) throw new CoreActivationError("protocol", 400);
    upstream.set(field, value);
  }
  const response = await callCore("", { method: "POST", body: upstream, signal });
  const body = await parseJson(response);
  if (response.status !== 201 && response.status !== 202) {
    throw new CoreActivationError("http", response.status, errorCode(body),
      errorField(body),
      errorReason(body));
  }
  if (body.correoActivacion !== "ENVIADO" && body.correoActivacion !== "FALLIDO") throw new CoreActivationError("protocol", response.status);
  return { result: { correoActivacion: body.correoActivacion }, status: response.status };
}

export async function resendActivation(token: string, signal?: AbortSignal): Promise<void> {
  const response = await callCore("/reenviar-correo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    signal,
  });
  const body = await parseOptionalJson(response);
  if (!response.ok) throw new CoreActivationError("http", response.status, body ? errorCode(body) : undefined);
  if (body && body.correoActivacion !== "ENVIADO") throw new CoreActivationError("protocol", response.status);
}
