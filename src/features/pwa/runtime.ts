export type InstallAvailability = "installed" | "ios" | "prompt" | "unavailable";

type RegistrationEnvironment = Readonly<{
  hostname: string;
  isProduction: boolean;
  isSecureContext: boolean;
  serviceWorkerSupported: boolean;
}>;

type InstallEnvironment = Readonly<{
  isIosSafari: boolean;
  isStandalone: boolean;
  promptAvailable: boolean;
}>;

export function canRegisterServiceWorker({
  hostname,
  isProduction,
  isSecureContext,
  serviceWorkerSupported,
}: RegistrationEnvironment): boolean {
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  return isProduction
    && serviceWorkerSupported
    && (isSecureContext || isLocalhost);
}

export function getInstallAvailability({
  isIosSafari,
  isStandalone,
  promptAvailable,
}: InstallEnvironment): InstallAvailability {
  if (isStandalone) return "installed";
  if (promptAvailable) return "prompt";
  if (isIosSafari) return "ios";
  return "unavailable";
}

export function detectIosSafari(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  const isIos = /iPad|iPhone|iPod/i.test(userAgent)
    || (platform === "MacIntel" && maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(userAgent);
  const isAlternativeIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  return isIos && isWebKit && !isAlternativeIosBrowser;
}
