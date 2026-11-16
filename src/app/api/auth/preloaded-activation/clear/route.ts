import { NextRequest, NextResponse } from "next/server";

import { authJson, noStoreHeaders } from "@/features/auth/session/server/routeResponses";
import { isSameOrigin } from "@/features/preloaded-activation/server/routeSecurity";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return authJson({ error: "invalid_request" }, 403);
  const response = NextResponse.json({ cleared: true }, { headers: noStoreHeaders });
  response.cookies.set("preloaded-activation-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/preloaded-activation",
    maxAge: 0,
  });
  return response;
}
