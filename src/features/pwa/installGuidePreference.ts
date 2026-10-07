const INSTALL_GUIDE_SEEN_KEY = "impulsate:pwa-install-guide:v1";

export function hasSeenInstallGuide(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_GUIDE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markInstallGuideSeen(): void {
  try {
    window.localStorage.setItem(INSTALL_GUIDE_SEEN_KEY, "true");
  } catch {
    // Closing the guide still works when browser storage is unavailable.
  }
}
