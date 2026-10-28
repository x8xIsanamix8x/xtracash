import type { NextRequest } from "next/server";

import { patchNotificationInCore } from "@/features/notifications/server/coreNotifications";
import { runNotificationsRequest } from "@/features/notifications/server/routeProxy";

export async function PATCH(request: NextRequest) {
  return runNotificationsRequest(request, async (accessToken, signal) => {
    await patchNotificationInCore(accessToken, "/leidas", signal);
    return { success: true };
  });
}
