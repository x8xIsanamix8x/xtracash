const ONBOARDING_COMPLETED_KEY = "xtracash:onboarding-completed";

export function hasCompletedOnboarding() {
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted() {
  try {
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  } catch {
    // The flow remains usable for the current session when storage is unavailable.
  }
}
