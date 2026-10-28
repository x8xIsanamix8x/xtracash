"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { isProtectedRoute } from "../routes";

const REFRESH_LEAD_TIME_MS = 30_000;
const RETRY_DELAY_MS = 15_000;

type SessionResponse = Readonly<{
  authenticated?: unknown;
  expiresAt?: unknown;
}>;

export function AuthSessionMonitor() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isProtectedRoute(pathname)) return;

    let isDisposed = false;
    let isChecking = false;
    let timer: number | null = null;
    let controller: AbortController | null = null;

    const clearTimer = () => {
      if (timer === null) return;
      window.clearTimeout(timer);
      timer = null;
    };

    const schedule = (delay: number) => {
      clearTimer();
      timer = window.setTimeout(checkSession, Math.max(1_000, delay));
    };

    const checkSession = async () => {
      if (isDisposed || isChecking) return;

      isChecking = true;
      controller = new AbortController();

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (isDisposed) return;

        if (response.status === 401) {
          router.replace(sessionExpiredUrl);
          return;
        }

        if (!response.ok) {
          schedule(RETRY_DELAY_MS);
          return;
        }

        let body: SessionResponse;
        try {
          body = await response.json() as SessionResponse;
        } catch {
          schedule(RETRY_DELAY_MS);
          return;
        }

        if (body.authenticated !== true || typeof body.expiresAt !== "number") {
          schedule(RETRY_DELAY_MS);
          return;
        }

        schedule(body.expiresAt - Date.now() - REFRESH_LEAD_TIME_MS);
      } catch (error) {
        if (!isDisposed && !(error instanceof Error && error.name === "AbortError")) {
          schedule(RETRY_DELAY_MS);
        }
      } finally {
        isChecking = false;
        controller = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    void checkSession();

    return () => {
      isDisposed = true;
      clearTimer();
      controller?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
