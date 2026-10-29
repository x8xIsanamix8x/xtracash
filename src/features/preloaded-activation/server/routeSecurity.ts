import "server-only";

import type { NextRequest } from "next/server";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function isValidIdentity(value: unknown): value is { cedula: string; correo: string } {
  return Boolean(
    value && typeof value === "object"
    && typeof (value as Record<string, unknown>).cedula === "string"
    && /^\d{5,9}$/.test(((value as Record<string, unknown>).cedula as string).trim())
    && typeof (value as Record<string, unknown>).correo === "string"
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(((value as Record<string, unknown>).correo as string).trim()),
  );
}
