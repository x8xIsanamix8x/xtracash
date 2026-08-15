export class SessionServiceError extends Error {
  constructor() {
    super("session-service-error");
    this.name = "SessionServiceError";
  }
}

export async function signOut(signal: AbortSignal): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch {
    throw new SessionServiceError();
  }

  if (!response.ok) throw new SessionServiceError();
}
