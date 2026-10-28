// IMOV-442: piezas puras de las notificaciones push, sin tocar el navegador, para poder probarlas.

export type PushSubscriptionPayload = Readonly<{
  endpoint: string;
  keys: Readonly<{ p256dh: string; auth: string }>;
}>;

/**
 * En qué situación está este dispositivo:
 * - unsupported: el navegador no tiene push.
 * - needs-install: iPhone/iPad sin instalar en la pantalla de inicio (iOS solo da push a la PWA instalada).
 * - denied: el usuario bloqueó las notificaciones; solo se reactivan desde los ajustes del teléfono.
 * - off / on: puede activarlas, o ya están activas.
 */
export type PushStatus = "unsupported" | "needs-install" | "denied" | "off" | "on";

type PushEnvironment = Readonly<{
  pushSupported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  permission: NotificationPermission | "unsupported";
  hasSubscription: boolean;
}>;

export function resolvePushStatus({
  pushSupported,
  isIos,
  isStandalone,
  permission,
  hasSubscription,
}: PushEnvironment): PushStatus {
  if (isIos && !isStandalone) return "needs-install";
  if (!pushSupported || permission === "unsupported") return "unsupported";
  if (permission === "denied") return "denied";
  return permission === "granted" && hasSubscription ? "on" : "off";
}

/** La clave pública VAPID (base64url) como la pide PushManager.subscribe(). */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

/** Lo que manda el navegador (PushSubscription.toJSON()), validado antes de reenviarlo al Core. */
export function parsePushSubscription(value: unknown): PushSubscriptionPayload | null {
  if (typeof value !== "object" || value === null) return null;
  const { endpoint, keys } = value as { endpoint?: unknown; keys?: unknown };
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 1000) return null;
  if (typeof keys !== "object" || keys === null) return null;
  const { p256dh, auth } = keys as { p256dh?: unknown; auth?: unknown };
  if (typeof p256dh !== "string" || p256dh.length === 0 || typeof auth !== "string" || auth.length === 0) return null;
  return { endpoint, keys: { p256dh, auth } };
}
