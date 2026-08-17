import "server-only";

import { NextResponse } from "next/server";

export const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function authJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}
