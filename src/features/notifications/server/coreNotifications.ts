import "server-only";

import { getServerCoreApiBaseUrl } from "@/config/serverCoreApi";

import { parseNotificationsPage, parseUnreadCount } from "../contractValidation";
import type { NotificationsPage, NotificationsQuery } from "../types";

export type CoreNotificationsErrorType = "configuration" | "http" | "network" | "protocol";

export class CoreNotificationsError extends Error {
  readonly type: CoreNotificationsErrorType;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(type: CoreNotificationsErrorType, status: number | null = null, detail: string | null = null) {
    super(type);
    this.name = "CoreNotificationsError";
    this.type = type;
    this.status = status;
    this.detail = detail;
  }
}

function coreUrl(path: string): string {
  const configuration = getServerCoreApiBaseUrl();
  if (!configuration.ok) throw new CoreNotificationsError("configuration");
  return `${configuration.baseUrl}/api/impulsate-movil/notificaciones${path}`;
}

async function requestCore(
  accessToken: string,
  path: string,
  method: "GET" | "PATCH",
  signal: AbortSignal,
): Promise<Response> {
  try {
    return await fetch(coreUrl(path), {
      method,
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
  } catch (error) {
    if (error instanceof CoreNotificationsError) throw error;
    throw new CoreNotificationsError("network");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CoreNotificationsError("protocol", response.status);
  }
}

async function checkResponse(response: Response): Promise<void> {
  if (response.ok) return;
  let detail: string | null = null;
  try { detail = (await response.text()).slice(0, 500); } catch { detail = null; }
  throw new CoreNotificationsError("http", response.status, detail);
}

export async function getNotificationsFromCore(
  accessToken: string,
  query: NotificationsQuery,
  signal: AbortSignal,
): Promise<NotificationsPage> {
  const params = new URLSearchParams({ page: String(query.page), size: String(query.size) });
  const response = await requestCore(accessToken, `?${params}`, "GET", signal);
  await checkResponse(response);
  const body = await readJson(response);
  const page = parseNotificationsPage(body);
  if (!page) throw new CoreNotificationsError("protocol", response.status, JSON.stringify(body).slice(0, 500));
  return page;
}

export async function getUnreadCountFromCore(accessToken: string, signal: AbortSignal): Promise<number> {
  const response = await requestCore(accessToken, "/no-leidas", "GET", signal);
  await checkResponse(response);
  const body = await readJson(response);
  const count = parseUnreadCount(body);
  if (count === null) throw new CoreNotificationsError("protocol", response.status, JSON.stringify(body).slice(0, 500));
  return count;
}

export async function patchNotificationInCore(
  accessToken: string,
  path: string,
  signal: AbortSignal,
): Promise<void> {
  const response = await requestCore(accessToken, path, "PATCH", signal);
  await checkResponse(response);
}
