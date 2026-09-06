const PROMPT_KEY = "master-onboarding-prompt-shown";

export function consumeMasterOnboardingPrompt(): boolean {
  try {
    if (window.sessionStorage.getItem(PROMPT_KEY) === "true") return false;
    window.sessionStorage.setItem(PROMPT_KEY, "true");
  } catch {
    // Keep the prompt available if session storage is unavailable.
  }
  return true;
}

export function resetMasterOnboardingPrompt(): void {
  try { window.sessionStorage.removeItem(PROMPT_KEY); } catch {}
}
