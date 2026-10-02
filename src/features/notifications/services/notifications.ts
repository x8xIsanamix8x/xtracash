import { parseNotificationsPage, parseUnreadCount } from "../contractValidation";
import type { NotificationsPage } from "../types";

export type NotificationsServiceErrorType = "aborted" | "invalid" | "network" | "server" | "unauthenticated";

export class NotificationsServiceError extends Error {
  readonly type: NotificationsServiceErrorType;
  constructor(type: NotificationsServiceErrorType) {
    super(type);
    this.name = "NotificationsServiceError";
    this.type = type;
  }
}

async function fetchSameOrigin(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(path, { cache: "no-store", credentials: "same-origin", ...init });
  } catch (error) {
    if (init.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new NotificationsServiceError("aborted");
    }
    throw new NotificationsServiceError("network");
  }
}

async function readBody(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { throw new NotificationsServiceError("invalid"); }
}

function mapResponseError(response: Response): never {
  if (response.status === 401) throw new NotificationsServiceError("unauthenticated");
  if (response.status === 400) throw new NotificationsServiceError("invalid");
  throw new NotificationsServiceError("server");
}

export async function getNotifications(page: number, size: number, signal: AbortSignal): Promise<NotificationsPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await fetchSameOrigin(`/api/notifications?${params}`, { method: "GET", signal });
  if (!response.ok) mapResponseError(response);
  const parsed = parseNotificationsPage(await readBody(response));
  if (!parsed) throw new NotificationsServiceError("invalid");
  return parsed;
}

export async function getUnreadCount(signal: AbortSignal): Promise<number> {
  const response = await fetchSameOrigin("/api/notifications/unread-count", { method: "GET", signal });
  if (!response.ok) mapResponseError(response);
  const body = await readBody(response);
  const count = typeof body === "object" && body !== null && "count" in body
    ? parseUnreadCount((body as { count: unknown }).count)
    : parseUnreadCount(body);
  if (count === null) throw new NotificationsServiceError("invalid");
  return count;
}

async function patch(path: string, signal?: AbortSignal): Promise<void> {
  const response = await fetchSameOrigin(path, { method: "PATCH", signal });
  if (!response.ok) mapResponseError(response);
}

export function markNotificationRead(id: string, signal?: AbortSignal): Promise<void> {
  return fetchSameOrigin("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    signal,
  }).then((response) => {
    if (!response.ok) mapResponseError(response);
  });
}

export function markAllNotificationsRead(signal?: AbortSignal): Promise<void> {
  return patch("/api/notifications/read-all", signal);
}
