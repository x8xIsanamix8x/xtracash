import { NextRequest, NextResponse } from "next/server";

import { authJson, noStoreHeaders } from "@/features/auth/session/server/routeResponses";
import {
  ACTIVATION_DOCUMENT_MAX_BYTES,
  ACTIVATION_DOCUMENT_TYPES,
  normalizeActivationName,
} from "@/features/preloaded-activation/validation";
import { CoreActivationError, submitPreloadedActivation } from "@/features/preloaded-activation/server/coreActivation";
import { activationErrorResponse } from "@/features/preloaded-activation/server/activationErrorResponse";
import { isSameOrigin } from "@/features/preloaded-activation/server/routeSecurity";

export const runtime = "nodejs";
const tokenCookie = "preloaded-activation-token";
const maxRequestBytes = 10 * 1024 * 1024 + 16 * 1024;

function clearToken(response: NextResponse) {
  response.cookies.set(tokenCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/preloaded-activation",
    maxAge: 0,
  });
  return response;
}

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return authJson({ error: "invalid_request" }, 403);
  const token = request.cookies.get(tokenCookie)?.value;
  if (!token) return authJson({ error: "TOKEN_INVALIDO" }, 401);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxRequestBytes) return authJson({ error: "DOCUMENTO_RECHAZADO", campo: "documentoCedula", motivo: "MUY_GRANDE" }, 413);

  let form: FormData;
  try { form = await request.formData(); } catch { return authJson({ error: "invalid_request" }, 400); }
  if (["cedula", "correo", "token"].some((key) => form.has(key))) return authJson({ error: "CAMPO_NO_EDITABLE" }, 400);
  const namePattern = /^\p{L}[\p{L}\p{M}]*(?:[-'’ ]\p{L}[\p{L}\p{M}]*)*$/u;
  for (const key of ["nombre", "apellido"]) {
    const value = form.get(key);
    if (typeof value !== "string") return authJson({ error: "invalid_request" }, 400);
    const normalized = normalizeActivationName(value);
    if (!normalized || normalized.length > 80 || !namePattern.test(normalized)) {
      return authJson({ error: "invalid_request" }, 400);
    }
    form.set(key, normalized);
  }
  const phone = form.get("telefono");
  if (typeof phone !== "string" || !/^[+0-9() -]{7,20}$/.test(phone.trim())) return authJson({ error: "invalid_request" }, 400);
  if (form.get("datosConfirmados") !== "true" || form.get("terminosAceptados") !== "true") {
    return authJson({ error: "invalid_request" }, 400);
  }
  const cedula = form.get("documentoCedula");
  const rif = form.get("documentoRif");
  if (!isImageFile(cedula) || !isImageFile(rif)) {
    return authJson({ error: "DOCUMENTO_RECHAZADO", campo: !isImageFile(cedula) ? "documentoCedula" : "documentoRif", motivo: "VACIO" }, 422);
  }
  for (const [field, file] of [["documentoCedula", cedula], ["documentoRif", rif]] as const) {
    if (!isImageFile(file) || file.size <= 0 || file.size > ACTIVATION_DOCUMENT_MAX_BYTES || !ACTIVATION_DOCUMENT_TYPES.includes(file.type as (typeof ACTIVATION_DOCUMENT_TYPES)[number])) {
      return authJson({ error: "DOCUMENTO_RECHAZADO", campo: field, motivo: !isImageFile(file) || file.size <= 0 ? "VACIO" : file.size > ACTIVATION_DOCUMENT_MAX_BYTES ? "MUY_GRANDE" : "TIPO_NO_PERMITIDO" }, 422);
    }
  }
  if (cedula.size + rif.size > 2 * ACTIVATION_DOCUMENT_MAX_BYTES) {
    return authJson({ error: "DOCUMENTO_RECHAZADO", campo: "documentoCedula", motivo: "MUY_GRANDE" }, 413);
  }

  try {
    const { result, status } = await submitPreloadedActivation(form, token, request.signal);
    return clearToken(NextResponse.json(result, { status, headers: noStoreHeaders }));
  } catch (error) {
    const response = activationErrorResponse(error);
    return error instanceof CoreActivationError
      && (error.code === "TOKEN_INVALIDO" || error.code === "ACTIVACION_REALIZADA")
      ? clearToken(response)
      : response;
  }
}
