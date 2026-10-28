import type { LoginData, LoginRequest } from "../types";
import { normalizeLoginIdentifier } from "../validation";

export type LoginServiceErrorType =
  | "aborted"
  | "http"
  | "invalidCredentials"
  | "network"
  | "server";

export class LoginServiceError extends Error {
  readonly type: LoginServiceErrorType;

  constructor(type: LoginServiceErrorType) {
    super(type);
    this.name = "LoginServiceError";
    this.type = type;
  }
}

export function createLoginRequest(data: LoginData): LoginRequest {
  return {
    identifier: normalizeLoginIdentifier(data.identifier),
    password: data.password,
  };
}

export async function login(request: LoginRequest, signal: AbortSignal): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new LoginServiceError("aborted");
    }

    throw new LoginServiceError("network");
  }

  if (response.ok) return;
  if (response.status === 401) throw new LoginServiceError("invalidCredentials");
  if (response.status >= 500) throw new LoginServiceError("server");
  throw new LoginServiceError("http");
}
