const REGISTRATION_MARKER_KEY = "registration";
const REGISTRATION_MARKER_VALUE = "submitted";

export const registrationSubmittedUrl = `/?${REGISTRATION_MARKER_KEY}=${REGISTRATION_MARKER_VALUE}`;

export function consumeRegistrationSubmittedMarker(): boolean {
  const url = new URL(window.location.href);

  if (url.searchParams.get(REGISTRATION_MARKER_KEY) !== REGISTRATION_MARKER_VALUE) {
    return false;
  }

  url.searchParams.delete(REGISTRATION_MARKER_KEY);
  const query = url.searchParams.toString();
  const cleanUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", cleanUrl);

  return true;
}
