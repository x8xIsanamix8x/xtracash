import type { ProfilePersonalInfo } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function readEmail(value: unknown): string | null {
  const email = readNonEmptyString(value);
  return email !== null && emailPattern.test(email) ? email : null;
}

export function parseCoreProfilePersonalInfo(
  value: unknown,
): ProfilePersonalInfo | null {
  if (!isRecord(value) || !isRecord(value.document)) return null;

  const fullName = readNonEmptyString(value.fullName);
  const documentType = readNonEmptyString(value.document.type);
  const documentNumber = readNonEmptyString(value.document.number);
  const email = readEmail(value.email);
  const phone = readNonEmptyString(value.phone);
  if (
    fullName === null
    || documentType === null
    || documentNumber === null
    || email === null
    || phone === null
  ) {
    return null;
  }

  return { fullName, documentType, documentNumber, email, phone };
}

export function parseProfilePersonalInfo(
  value: unknown,
): ProfilePersonalInfo | null {
  if (!isRecord(value)) return null;

  const fullName = readNonEmptyString(value.fullName);
  const documentType = readNonEmptyString(value.documentType);
  const documentNumber = readNonEmptyString(value.documentNumber);
  const email = readEmail(value.email);
  const phone = readNonEmptyString(value.phone);
  if (
    fullName === null
    || documentType === null
    || documentNumber === null
    || email === null
    || phone === null
  ) {
    return null;
  }

  return { fullName, documentType, documentNumber, email, phone };
}
