const PUSH_GUIDE_SEEN_KEY = "impulsate:push-notifications-guide:v1";

export function hasSeenPushGuide(): boolean {
  try {
    return window.localStorage.getItem(PUSH_GUIDE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markPushGuideSeen(): void {
  try {
    window.localStorage.setItem(PUSH_GUIDE_SEEN_KEY, "true");
  } catch {
    // The guide remains usable when browser storage is unavailable.
  }
}
