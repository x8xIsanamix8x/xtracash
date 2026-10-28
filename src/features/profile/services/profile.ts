import { parseProfilePersonalInfo } from "../contractValidation";
import type { ProfilePersonalInfo } from "../types";

export type ProfileServiceErrorType =
  | "aborted"
  | "invalid"
  | "network"
  | "server"
  | "unauthenticated";

export class ProfileServiceError extends Error {
  readonly type: ProfileServiceErrorType;

  constructor(type: ProfileServiceErrorType) {
    super(type);
    this.name = "ProfileServiceError";
    this.type = type;
  }
}

export async function getProfilePersonalInfo(
  signal: AbortSignal,
): Promise<ProfilePersonalInfo> {
  let response: Response;

  try {
    response = await fetch("/api/profile/personal-info", {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new ProfileServiceError("aborted");
    }
    throw new ProfileServiceError("network");
  }

  if (response.status === 401) {
    throw new ProfileServiceError("unauthenticated");
  }
  if (!response.ok) throw new ProfileServiceError("server");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ProfileServiceError("invalid");
  }

  const personalInfo = parseProfilePersonalInfo(body);
  if (personalInfo === null) throw new ProfileServiceError("invalid");
  return personalInfo;
}
