export function isBiometricAccessFeatureEnabled(
  value = process.env.NEXT_PUBLIC_BIOMETRIC_ACCESS_ENABLED,
): boolean {
  return value === "true";
}

export const biometricAccessFeatureEnabled =
  isBiometricAccessFeatureEnabled();
