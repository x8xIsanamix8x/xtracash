import type { NextRequest } from "next/server";

import {
  CoreRecoveryError,
  requestPasswordRecoveryFromCore,
} from "@/features/auth/recovery/server/coreRecovery";
import { parseRecoveryRequest } from "@/features/auth/recovery/validation";
import { authJson } from "@/features/auth/session/server/routeResponses";

async function readRequest(request: NextRequest) {
  try {
    return parseRecoveryRequest(await request.json());
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const recoveryRequest = await readRequest(request);
  if (recoveryRequest === null) {
    return authJson({ error: "invalid_request" }, 400);
  }

  try {
    await requestPasswordRecoveryFromCore(recoveryRequest, request.signal);
    return authJson({ requested: true });
  } catch (error) {
    if (error instanceof CoreRecoveryError) {
      if (
        error.type === "configuration"
        || error.type === "network"
      ) {
        return authJson({ error: "service_unavailable" }, 503);
      }
    }

    return authJson({ error: "upstream_error" }, 502);
  }
}
