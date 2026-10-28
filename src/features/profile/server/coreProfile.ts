import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import { parseCoreProfilePersonalInfo } from "../contractValidation";
import type { ProfilePersonalInfo } from "../types";

export type CoreProfileErrorType =
  | "configuration"
  | "http"
  | "network"
  | "protocol";

export class CoreProfileError extends Error {
  readonly type: CoreProfileErrorType;
  readonly status: number | null;

  constructor(type: CoreProfileErrorType, status: number | null = null) {
    super(type);
    this.name = "CoreProfileError";
    this.type = type;
    this.status = status;
  }
}

function getPersonalInfoEndpoint(): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new CoreProfileError("configuration");

  return `${configuration.baseUrl}/api/impulsate-movil/personal-info`;
}

export async function getProfilePersonalInfoFromCore(
  accessToken: string,
  signal: AbortSignal,
): Promise<ProfilePersonalInfo> {
  let response: Response;

  try {
    response = await fetch(getPersonalInfoEndpoint(), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
  } catch (error) {
    if (error instanceof CoreProfileError) throw error;
    throw new CoreProfileError("network");
  }

  if (!response.ok) {
    throw new CoreProfileError("http", response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CoreProfileError("protocol");
  }

  const personalInfo = parseCoreProfilePersonalInfo(body);
  if (personalInfo === null) throw new CoreProfileError("protocol");
  return personalInfo;
}
