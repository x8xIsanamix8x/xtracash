import { getCoreApiBaseUrl } from "@/config/coreApi";

import type { RegistrationData, RegistrationRequest } from "../types";

export type RegistrationServiceErrorType = "aborted" | "configuration" | "http" | "network";

export class RegistrationServiceError extends Error {
  readonly type: RegistrationServiceErrorType;

  constructor(type: RegistrationServiceErrorType) {
    super(type);
    this.name = "RegistrationServiceError";
    this.type = type;
  }
}

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

export function createRegistrationRequest(
  data: RegistrationData,
  termsAccepted: true,
): RegistrationRequest {
  return {
    documentType: data.nationality,
    documentNumber: data.documentNumber.trim(),
    name: normalizeName(data.firstName),
    lastName: normalizeName(data.lastName),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    termsAccepted,
  };
}

export async function registerUser(
  request: RegistrationRequest,
  signal: AbortSignal,
): Promise<void> {
  const configuration = getCoreApiBaseUrl();

  if (!configuration.ok) {
    throw new RegistrationServiceError(configuration.error.type);
  }

  let response: Response;

  try {
    response = await fetch(`${configuration.baseUrl}/api/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new RegistrationServiceError("aborted");
    }

    throw new RegistrationServiceError("network");
  }

  if (!response.ok) {
    throw new RegistrationServiceError("http");
  }
}
