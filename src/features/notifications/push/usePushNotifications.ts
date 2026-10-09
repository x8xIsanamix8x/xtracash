"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PushStatus } from "./pushContract";
import { disablePushNotifications, enablePushNotifications, getPushStatus } from "./pushNotifications";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getPushStatus().then((next) => { if (active) setStatus(next); }).catch(() => { if (active) setStatus("unsupported"); });
    return () => { active = false; };
  }, []);

  const run = useCallback(async (action: () => Promise<PushStatus>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailed(false);
    try {
      setStatus(await action());
    } catch {
      setFailed(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  return {
    status,
    busy,
    failed,
    enable: () => run(enablePushNotifications),
    disable: () => run(disablePushNotifications),
  };
}
