import type { Nationality, RegistrationData, RegistrationRequest } from "./types";

export const normalizeRegistrationName = (value: string) => value.trim();

function isNationality(value: RegistrationData["nationality"]): value is Nationality {
  return value === "V" || value === "E";
}

export function createRegistrationRequest(
  data: RegistrationData,
  termsAccepted: true,
): RegistrationRequest {
  if (!isNationality(data.nationality)) {
    throw new Error("invalid-registration-nationality");
  }

  return {
    documentType: data.nationality,
    documentNumber: data.documentNumber.trim(),
    name: normalizeRegistrationName(data.firstName),
    lastName: normalizeRegistrationName(data.lastName),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    termsAccepted,
  };
}
