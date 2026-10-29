import type {
  PreloadedActivationProfile,
  PreloadedActivationSubmission,
} from "../types";

export type PreloadedActivationErrorCode =
  | "ACTIVACION_REALIZADA"
  | "API_KEY_INVALIDA"
  | "DEMASIADOS_INTENTOS"
  | "DOCUMENTO_RECHAZADO"
  | "NETWORK"
  | "SIN_COINCIDENCIA"
  | "TOKEN_INVALIDO"
  | "UNAVAILABLE"
  | "UNKNOWN";

export class PreloadedActivationError extends Error {
  readonly code: PreloadedActivationErrorCode;
  readonly field?: "documentoCedula" | "documentoRif";
  readonly reason?: "VACIO" | "MUY_GRANDE" | "TIPO_NO_PERMITIDO";

  constructor(
    code: PreloadedActivationErrorCode,
    options?: Readonly<{
      field?: "documentoCedula" | "documentoRif";
      reason?: "VACIO" | "MUY_GRANDE" | "TIPO_NO_PERMITIDO";
    }>,
  ) {
    super(code);
    this.name = "PreloadedActivationError";
    this.code = code;
    this.field = options?.field;
    this.reason = options?.reason;
  }
}

async function readApiResponse<T>(response: Response): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new PreloadedActivationError("UNKNOWN");
  }

  if (response.ok) return body as T;
  const candidate = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  const code = typeof candidate.error === "string"
    ? candidate.error.toUpperCase()
    : "UNKNOWN";

  if (code === "DOCUMENTO_RECHAZADO") {
    throw new PreloadedActivationError(code, {
      field: candidate.campo === "documentoCedula" || candidate.campo === "documentoRif"
        ? candidate.campo
        : undefined,
      reason: candidate.motivo === "VACIO"
        || candidate.motivo === "MUY_GRANDE"
        || candidate.motivo === "TIPO_NO_PERMITIDO"
        ? candidate.motivo
        : undefined,
    });
  }

  const knownCodes: readonly string[] = [
    "ACTIVACION_REALIZADA",
    "API_KEY_INVALIDA",
    "DEMASIADOS_INTENTOS",
    "SIN_COINCIDENCIA",
    "TOKEN_INVALIDO",
  ];
  if (knownCodes.includes(code)) {
    throw new PreloadedActivationError(code as PreloadedActivationErrorCode);
  }
  if (response.status === 503 || response.status === 502) {
    throw new PreloadedActivationError("UNAVAILABLE");
  }
  throw new PreloadedActivationError("UNKNOWN");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseProfile(value: unknown): PreloadedActivationProfile {
  if (!isObject(value)
    || typeof value.cedula !== "string"
    || typeof value.correo !== "string"
    || typeof value.nombre !== "string"
    || typeof value.apellido !== "string"
    || typeof value.telefono !== "string"
    || (value.estado !== "VALIDADA" && value.estado !== "PENDIENTE_ACTIVACION")
    || (value.correoActivacion !== null && value.correoActivacion !== "ENVIADO" && value.correoActivacion !== "FALLIDO")) {
    throw new PreloadedActivationError("UNKNOWN");
  }
  return value as PreloadedActivationProfile;
}

function parseSubmission(value: unknown): PreloadedActivationSubmission {
  if (!isObject(value) || (value.correoActivacion !== "ENVIADO" && value.correoActivacion !== "FALLIDO")) {
    throw new PreloadedActivationError("UNKNOWN");
  }
  return { correoActivacion: value.correoActivacion };
}

export async function validateInvitation(
  request: Readonly<{ cedula: string; correo: string }>,
  signal: AbortSignal,
): Promise<PreloadedActivationProfile> {
  let response: Response;
  try {
    response = await fetch("/api/auth/preloaded-activation/validate", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new PreloadedActivationError("NETWORK");
  }
  return parseProfile(await readApiResponse<unknown>(response));
}

export async function submitPreloadedActivation(
  formData: FormData,
  signal: AbortSignal,
): Promise<PreloadedActivationSubmission> {
  let response: Response;
  try {
    response = await fetch("/api/auth/preloaded-activation/submit", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      body: formData,
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new PreloadedActivationError("NETWORK");
  }
  return parseSubmission(await readApiResponse<unknown>(response));
}

export async function resendActivationEmail(
  request: Readonly<{ cedula: string; correo: string }>,
  signal: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/preloaded-activation/resend", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new PreloadedActivationError("NETWORK");
  }
  await readApiResponse<unknown>(response);
}
export async function clearActivationToken(signal?: AbortSignal): Promise<void> {
  const response = await fetch("/api/auth/preloaded-activation/clear", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  await readApiResponse<unknown>(response);
}
