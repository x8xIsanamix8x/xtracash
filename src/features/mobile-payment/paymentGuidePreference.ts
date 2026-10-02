export const PAYMENT_GUIDE_SEEN_KEY = "impulsate:mobile-payment-guide:v1";

export function hasSeenPaymentGuide() {
  try {
    return window.localStorage.getItem(PAYMENT_GUIDE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markPaymentGuideSeen() {
  try {
    window.localStorage.setItem(PAYMENT_GUIDE_SEEN_KEY, "true");
  } catch {
    // Closing the guide still works when browser storage is unavailable.
  }
}
