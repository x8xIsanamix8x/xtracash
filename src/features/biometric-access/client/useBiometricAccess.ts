"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BiometricAccessStatus, StartBiometricFlow } from "../types";
import { getBiometricVaultErrorMessage } from "../integration";
import {
  detectWebAuthnCapability,
  getBiometricActionFailureStatus,
} from "./detection";

export function useBiometricAccess(action: StartBiometricFlow) {
  const [status, setStatus] = useState<BiometricAccessStatus>("checking");
  const [message, setMessage] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const checkCapability = useCallback(() => {
    setStatus("checking");

    void detectWebAuthnCapability().then((capability) => {
      if (mountedRef.current && requestRef.current === null) {
        setStatus(capability.status);
      }
    });
  }, []);

  useEffect(() => {
    let isActive = true;
    mountedRef.current = true;

    void detectWebAuthnCapability().then((capability) => {
      if (isActive && requestRef.current === null) {
        // This is only a preliminary check. Real PRF output is required by the vault.
        setStatus(capability.status);
      }
    });

    return () => {
      isActive = false;
      mountedRef.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (requestRef.current !== null || !["supported", "cancelled", "error"].includes(status)) {
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("checking");
    setMessage("");

    try {
      await action({ signal: controller.signal });
      if (mountedRef.current) setStatus("supported");
    } catch (error) {
      if (mountedRef.current) {
        setMessage(getBiometricVaultErrorMessage(error));
        setStatus(getBiometricActionFailureStatus(error));
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [action, status]);

  return { checkCapability, start, status, message } as const;
}
