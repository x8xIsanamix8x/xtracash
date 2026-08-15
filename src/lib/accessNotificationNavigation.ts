const REGISTRATION_MARKER_KEY = "registration";
const REGISTRATION_MARKER_VALUE = "submitted";
const RECOVERY_MARKER_KEY = "recovery";
const RECOVERY_MARKER_VALUE = "requested";

export type AccessNotification = "recoveryRequested" | "registrationSubmitted";

export const registrationSubmittedUrl = `/?${REGISTRATION_MARKER_KEY}=${REGISTRATION_MARKER_VALUE}`;
export const recoveryRequestedUrl = `/?${RECOVERY_MARKER_KEY}=${RECOVERY_MARKER_VALUE}`;

export function consumeAccessNotification(): AccessNotification | null {
  const url = new URL(window.location.href);
  const hasRegistrationMarker =
    url.searchParams.get(REGISTRATION_MARKER_KEY) === REGISTRATION_MARKER_VALUE;
  const hasRecoveryMarker = url.searchParams.get(RECOVERY_MARKER_KEY) === RECOVERY_MARKER_VALUE;

  if (!hasRegistrationMarker && !hasRecoveryMarker) {
    return null;
  }

  if (hasRegistrationMarker) url.searchParams.delete(REGISTRATION_MARKER_KEY);
  if (hasRecoveryMarker) url.searchParams.delete(RECOVERY_MARKER_KEY);

  const query = url.searchParams.toString();
  const cleanUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", cleanUrl);

  return hasRecoveryMarker ? "recoveryRequested" : "registrationSubmitted";
}
