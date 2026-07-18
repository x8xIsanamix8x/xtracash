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

export function clearOnboardingPreference() {
  try {
    window.localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch {
    // The in-memory state still allows the onboarding to be repeated.
  }
}
