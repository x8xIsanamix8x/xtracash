import "server-only";

import type { NextRequest } from "next/server";

import { isActivationNationality, type ActivationNationality } from "../validation";
import { matchesPublicHost } from "./activationOrigin";

export function isSameOrigin(request: NextRequest): boolean {
  return matchesPublicHost(
    request.headers.get("origin"),
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
  );
}

export function isValidIdentity(value: unknown): value is { nacionalidad: ActivationNationality; cedula: string; correo: string } {
  return Boolean(
    value && typeof value === "object"
    && isActivationNationality((value as Record<string, unknown>).nacionalidad)
    && typeof (value as Record<string, unknown>).cedula === "string"
    && /^\d{5,9}$/.test(((value as Record<string, unknown>).cedula as string).trim())
    && typeof (value as Record<string, unknown>).correo === "string"
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(((value as Record<string, unknown>).correo as string).trim()),
  );
}
