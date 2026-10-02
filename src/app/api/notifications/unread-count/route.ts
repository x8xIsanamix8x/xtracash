import type { NextRequest } from "next/server";

import { getUnreadCountFromCore } from "@/features/notifications/server/coreNotifications";
import { runNotificationsRequest } from "@/features/notifications/server/routeProxy";

export async function GET(request: NextRequest) {
  return runNotificationsRequest(request, async (accessToken, signal) => ({
    count: await getUnreadCountFromCore(accessToken, signal),
  }));
}
