import "server-only";

import { authJson } from "@/features/auth/session/server/routeResponses";

import { CoreActivationError } from "./coreActivation";

export function activationErrorResponse(error: unknown) {
  if (!(error instanceof CoreActivationError)) {
    return authJson({ error: "UNAVAILABLE", ...(process.env.NODE_ENV !== "production" ? { diagnostic: "bff_unexpected" } : {}) }, 502);
  }

  if (error.type === "configuration") {
    return authJson({ error: "UNAVAILABLE", ...(process.env.NODE_ENV !== "production" ? { diagnostic: "bff_configuration" } : {}) }, 503);
  }
  if (error.type === "network") {
    return authJson({ error: "UNAVAILABLE", ...(process.env.NODE_ENV !== "production" ? { diagnostic: "core_network" } : {}) }, 502);
  }
  if (error.type === "protocol") {
    const diagnostic = `core_protocol${error.status ? `_${error.status}` : ""}`;
    return authJson({ error: "UNAVAILABLE", ...(process.env.NODE_ENV !== "production" ? { diagnostic } : {}) }, 502);
  }

  const code = error.code ?? (error.status === 401 ? "API_KEY_INVALIDA" : undefined);
  if (code === "API_KEY_INVALIDA") {
    return authJson({ error: code, ...(process.env.NODE_ENV !== "production" ? { diagnostic: "core_api_key_rejected" } : {}) }, 503);
  }
  if (code === "SIN_COINCIDENCIA") return authJson({ error: code }, 404);
  if (code === "ACTIVACION_REALIZADA" || code === "ACTIVACION_SIN_ENVIAR") return authJson({ error: code }, 409);
  if (code === "DEMASIADOS_INTENTOS") return authJson({ error: code }, 429);
  if (code === "TOKEN_INVALIDO") return authJson({ error: code }, 401);
  if (code === "DOCUMENTO_RECHAZADO") {
    return authJson({ error: code, ...(error.field ? { campo: error.field } : {}), ...(error.reason ? { motivo: error.reason } : {}) }, 422);
  }
  if (code === "CAMPO_NO_EDITABLE") return authJson({ error: code }, 400);

  return authJson({
    error: "UNAVAILABLE",
    ...(process.env.NODE_ENV !== "production" ? { diagnostic: `core_http_${error.status ?? "unknown"}` } : {}),
  }, 502);
}
