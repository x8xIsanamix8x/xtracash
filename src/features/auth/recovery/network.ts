const retryableConnectionCodes = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
]);

export function isRetryableRecoveryConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const cause = (error as { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") return false;

  const candidate = cause as Record<string, unknown>;
  if (typeof candidate.code !== "string") return false;

  if (retryableConnectionCodes.has(candidate.code)) return true;
  return candidate.code === "ETIMEDOUT" && candidate.syscall === "connect";
}
