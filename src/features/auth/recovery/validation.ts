const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeRecoveryIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase();

export function validateRecoveryIdentifier(identifier: string) {
  const value = normalizeRecoveryIdentifier(identifier);

  if (!value) {
    return "Ingresa tu correo electrónico.";
  }

  return emailPattern.test(value) ? "" : "Ingresa un correo electrónico válido.";
}

export function parseRecoveryRequest(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const identifier = (value as Record<string, unknown>).identifier;
  if (typeof identifier !== "string" || validateRecoveryIdentifier(identifier)) {
    return null;
  }

  return { identifier: normalizeRecoveryIdentifier(identifier) } as const;
}

export function parseCoreRecoveryResponse(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const message = (value as Record<string, unknown>).message;
  if (typeof message !== "string" || !message.trim()) return null;

  return { message } as const;
}

export function createCoreRecoveryEndpoint(baseUrl: string): string {
  return new URL("/api/recuperacion", `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

export function isSuccessfulRecoveryStatus(status: number): boolean {
  return status === 200 || status === 202;
}
