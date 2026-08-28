import type { RegistrationData, RegistrationRequest } from "./types";

export function createRegistrationRequest(
  data: RegistrationData,
  termsAccepted: true,
): RegistrationRequest {
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
