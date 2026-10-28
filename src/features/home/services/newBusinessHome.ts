import { parseNewBusinessHomeData } from "../newBusinessValidation";
import type { NewBusinessHomeData } from "../newBusinessTypes";

export type NewBusinessHomeErrorType = "aborted" | "invalid" | "network" | "server" | "unauthenticated";

export class NewBusinessHomeError extends Error {
  constructor(readonly type: NewBusinessHomeErrorType) {
    super(type);
    this.name = "NewBusinessHomeError";
  }
}

export async function getNewBusinessHomeData(signal: AbortSignal): Promise<NewBusinessHomeData> {
  let response: Response;
  try {
    response = await fetch("/api/home/summary", { cache: "no-store", credentials: "same-origin", signal });
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new NewBusinessHomeError("aborted");
    throw new NewBusinessHomeError("network");
  }
  if (response.status === 401) throw new NewBusinessHomeError("unauthenticated");
  if (!response.ok) throw new NewBusinessHomeError("server");
  let body: unknown;
  try { body = await response.json(); } catch { throw new NewBusinessHomeError("invalid"); }
  const parsed = parseNewBusinessHomeData(body);
  if (!parsed) throw new NewBusinessHomeError("invalid");
  return parsed;
}
