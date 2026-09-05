export type BiometricAccessStatus =
  | "checking"
  | "supported"
  | "unsupported"
  | "unavailable"
  | "cancelled"
  | "error";

export type BiometricFlowContext = Readonly<{
  signal: AbortSignal;
}>;

export type StartBiometricFlow = (
  context: BiometricFlowContext,
) => Promise<void>;

export type WebAuthnCapability = Readonly<{
  hasPublicKeyCredential: boolean;
  isSecureExecutionContext: boolean;
  platformAuthenticatorAvailable: boolean | null;
  status: Extract<
    BiometricAccessStatus,
    "supported" | "unsupported" | "unavailable" | "error"
  >;
}>;
