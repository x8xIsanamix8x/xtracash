import { NextRequest, NextResponse } from "next/server";

import { authJson, noStoreHeaders } from "@/features/auth/session/server/routeResponses";
import { validatePreloadedIdentity } from "@/features/preloaded-activation/server/coreActivation";
import { activationErrorResponse } from "@/features/preloaded-activation/server/activationErrorResponse";
import { isSameOrigin, isValidIdentity } from "@/features/preloaded-activation/server/routeSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return authJson({ error: "invalid_request" }, 403);
  let body: unknown;
  try { body = await request.json(); } catch { return authJson({ error: "invalid_request" }, 400); }
  if (!isValidIdentity(body)) return authJson({ error: "invalid_request" }, 400);

  try {
    const profile = await validatePreloadedIdentity(body.cedula.trim(), body.correo.trim(), request.signal);
    const digits = profile.cedula.replace(/^[VJvj]-?/, "");
    const expiry = Date.parse(profile.tokenVenceEn);
    const maxAge = Math.min(900, Math.floor((expiry - Date.now()) / 1000));
    if (maxAge <= 0) return authJson({ error: "TOKEN_INVALIDO" }, 502);
    const response = NextResponse.json({
      cedula: digits,
      correo: profile.correo,
      nombre: profile.nombre,
      apellido: profile.apellido,
      telefono: profile.telefono,
      estado: profile.estado,
      correoActivacion: profile.correoActivacion,
    }, { headers: noStoreHeaders });
    response.cookies.set("preloaded-activation-token", profile.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/preloaded-activation",
      maxAge,
    });
    return response;
  } catch (error) {
    return activationErrorResponse(error);
  }
}
