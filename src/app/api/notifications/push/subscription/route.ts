import { NextResponse, type NextRequest } from "next/server";

import {
  deletePushSubscriptionInCore,
  putPushSubscriptionInCore,
} from "@/features/notifications/server/coreNotifications";
import { runNotificationsRequest } from "@/features/notifications/server/routeProxy";
import { parsePushSubscription } from "@/features/notifications/push/pushContract";

async function readBody(request: NextRequest): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

function invalid() {
  return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const subscription = parsePushSubscription(await readBody(request));
  if (!subscription) return invalid();
  return runNotificationsRequest(request, async (accessToken, signal) => {
    await putPushSubscriptionInCore(accessToken, subscription, signal);
    return { success: true };
  });
}

export async function DELETE(request: NextRequest) {
  const body = await readBody(request);
  const endpoint = typeof body === "object" && body !== null && "endpoint" in body
    ? (body as { endpoint: unknown }).endpoint
    : null;
  if (typeof endpoint !== "string" || endpoint.length === 0) return invalid();
  return runNotificationsRequest(request, async (accessToken, signal) => {
    await deletePushSubscriptionInCore(accessToken, endpoint, signal);
    return { success: true };
  });
}
