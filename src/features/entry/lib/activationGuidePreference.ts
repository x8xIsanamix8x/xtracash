const ACTIVATION_GUIDE_SEEN_KEY = "impulsate:activation-guide:v1";

export function hasSeenActivationGuide(): boolean {
  try {
    return window.localStorage.getItem(ACTIVATION_GUIDE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markActivationGuideSeen(): void {
  try {
    window.localStorage.setItem(ACTIVATION_GUIDE_SEEN_KEY, "true");
  } catch {
    // The welcome remains usable when browser storage is unavailable.
  }
}
