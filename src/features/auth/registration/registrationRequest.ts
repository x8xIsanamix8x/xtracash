import type { Nationality, RegistrationData, RegistrationRequest } from "./types";

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
    name: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    termsAccepted,
  };
}
