import { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import { resendActivation, validatePreloadedIdentity } from "@/features/preloaded-activation/server/coreActivation";
import { activationErrorResponse } from "@/features/preloaded-activation/server/activationErrorResponse";
import { isSameOrigin, isValidIdentity } from "@/features/preloaded-activation/server/routeSecurity";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return authJson({ error: "invalid_request" }, 403);
  let body: unknown;
  try { body = await request.json(); } catch { return authJson({ error: "invalid_request" }, 400); }
  if (!isValidIdentity(body)) return authJson({ error: "invalid_request" }, 400);
  try {
    const validated = await validatePreloadedIdentity(body.cedula.trim(), body.correo.trim(), request.signal);
    await resendActivation(validated.token, request.signal);
    return authJson({ correoActivacion: "ENVIADO" });
  } catch (error) {
    return activationErrorResponse(error);
  }
}
