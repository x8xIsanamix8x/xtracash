const REGISTRATION_MARKER_KEY = "registration";
const REGISTRATION_MARKER_VALUE = "submitted";
const RECOVERY_MARKER_KEY = "recovery";
const RECOVERY_MARKER_VALUE = "requested";
const AUTH_MARKER_KEY = "auth";
const AUTH_REQUIRED_VALUE = "required";
const AUTH_EXPIRED_VALUE = "expired";

export type AccessNotification =
  | "recoveryRequested"
  | "registrationSubmitted"
  | "sessionExpired";

export type AccessNavigationRequest = Readonly<{
  notification: AccessNotification | null;
  openSignIn: true;
}>;

export const registrationSubmittedUrl = `/?${REGISTRATION_MARKER_KEY}=${REGISTRATION_MARKER_VALUE}`;
export const recoveryRequestedUrl = `/?${RECOVERY_MARKER_KEY}=${RECOVERY_MARKER_VALUE}`;
export const signInRequiredUrl = `/?${AUTH_MARKER_KEY}=${AUTH_REQUIRED_VALUE}`;
export const sessionExpiredUrl = `/?${AUTH_MARKER_KEY}=${AUTH_EXPIRED_VALUE}`;

export function consumeAccessNavigationRequest(): AccessNavigationRequest | null {
  const url = new URL(window.location.href);
  const hasRegistrationMarker =
    url.searchParams.get(REGISTRATION_MARKER_KEY) === REGISTRATION_MARKER_VALUE;
  const hasRecoveryMarker = url.searchParams.get(RECOVERY_MARKER_KEY) === RECOVERY_MARKER_VALUE;
  const authMarker = url.searchParams.get(AUTH_MARKER_KEY);
  const hasAuthMarker = authMarker === AUTH_REQUIRED_VALUE || authMarker === AUTH_EXPIRED_VALUE;

  if (!hasRegistrationMarker && !hasRecoveryMarker && !hasAuthMarker) {
    return null;
  }

  if (hasRegistrationMarker) url.searchParams.delete(REGISTRATION_MARKER_KEY);
  if (hasRecoveryMarker) url.searchParams.delete(RECOVERY_MARKER_KEY);
  if (hasAuthMarker) url.searchParams.delete(AUTH_MARKER_KEY);

  const query = url.searchParams.toString();
  const cleanUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", cleanUrl);

  const notification = hasRecoveryMarker
    ? "recoveryRequested"
    : hasRegistrationMarker
      ? "registrationSubmitted"
      : authMarker === AUTH_EXPIRED_VALUE
        ? "sessionExpired"
        : null;

  return { notification, openSignIn: true };
}
