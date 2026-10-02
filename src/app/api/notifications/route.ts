import type { NextRequest } from "next/server";

import { authJson } from "@/features/auth/session/server/routeResponses";
import {
  getNotificationsFromCore,
  patchNotificationInCore,
} from "@/features/notifications/server/coreNotifications";
import { runNotificationsRequest } from "@/features/notifications/server/routeProxy";

const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const rawPage = request.nextUrl.searchParams.get("page") ?? "0";
  const rawSize = request.nextUrl.searchParams.get("size") ?? "20";
  const page = Number(rawPage);
  const size = Number(rawSize);
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) {
    return authJson({ error: "invalid_request" }, 400);
  }
  return runNotificationsRequest(request, (accessToken, signal) => (
    getNotificationsFromCore(accessToken, { page, size }, signal)
  ));
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return authJson({ error: "invalid_request" }, 400); }
  const id = typeof body === "object" && body !== null && "id" in body
    ? (body as { id?: unknown }).id
    : null;
  if (typeof id !== "string" || !id.trim() || id.length > 200) {
    return authJson({ error: "invalid_request" }, 400);
  }
  return runNotificationsRequest(request, async (accessToken, signal) => {
    await patchNotificationInCore(accessToken, `/${encodeURIComponent(id)}/leida`, signal);
    return { success: true };
  });
}
