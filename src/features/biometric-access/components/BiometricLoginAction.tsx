"use client";

import type { StartBiometricFlow } from "../types";
import { BiometricActionControl } from "./BiometricActionControl";

export function BiometricLoginAction({ onAuthenticate, disabled }: Readonly<{
  onAuthenticate: StartBiometricFlow;
  disabled?: boolean;
}>) {
  return <BiometricActionControl actionLabel="Identificación biométrica" disabled={disabled}
    onAction={onAuthenticate} presentation="login-icon" />;
}
