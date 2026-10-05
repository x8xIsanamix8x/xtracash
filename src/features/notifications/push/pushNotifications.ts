import { detectIosSafari } from "@/features/pwa/runtime";

import { parsePushSubscription, resolvePushStatus, urlBase64ToUint8Array, type PushStatus } from "./pushContract";

// IMOV-442: alta y baja de este dispositivo para recibir notificaciones push.

export class PushNotificationsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PushNotificationsError";
  }
}

function isPushSupported(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos(): boolean {
  return detectIosSafari(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)
    || /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

/** El service worker ya registrado por PwaProvider (solo en producción y con HTTPS). */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  return (await navigator.serviceWorker.getRegistration("/")) ?? null;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const worker = await registration();
  return worker ? await worker.pushManager.getSubscription() : null;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (typeof window === "undefined") return "unsupported";
  const supported = isPushSupported() && (await registration()) !== null;
  return resolvePushStatus({
    pushSupported: supported,
    isIos: isIos(),
    isStandalone: isStandalone(),
    permission: "Notification" in window ? Notification.permission : "unsupported",
    hasSubscription: (await currentSubscription()) !== null,
  });
}

async function sendToCore(subscription: PushSubscription): Promise<void> {
  const payload = parsePushSubscription(subscription.toJSON());
  if (!payload) throw new PushNotificationsError("invalid_subscription");
  const response = await fetch("/api/notifications/push/subscription", {
    method: "PUT",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new PushNotificationsError(`subscription_failed_${response.status}`);
}

/** Pide el permiso (tiene que llamarse desde un toque del usuario) y registra el dispositivo. */
export async function enablePushNotifications(): Promise<PushStatus> {
  const worker = await registration();
  if (!worker) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  let subscription = await worker.pushManager.getSubscription();
  if (!subscription) {
    const response = await fetch("/api/notifications/push/public-key", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new PushNotificationsError(`public_key_failed_${response.status}`);
    const { publicKey } = await response.json() as { publicKey: string };
    subscription = await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await sendToCore(subscription);
  return "on";
}

/** Da de baja este dispositivo en el Core y en el navegador. */
export async function disablePushNotifications(): Promise<PushStatus> {
  const subscription = await currentSubscription();
  if (subscription) {
    await fetch("/api/notifications/push/subscription", {
      method: "DELETE",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe().catch(() => false);
  }
  return getPushStatus();
}

/**
 * Si este navegador ya está suscrito, se lo vuelve a informar al Core al abrir la app: el navegador
 * puede rotar sus claves, y si en el teléfono inició sesión otra persona, el dispositivo pasa a ser suyo.
 */
export async function syncPushSubscription(): Promise<void> {
  if (!isPushSupported() || Notification.permission !== "granted") return;
  const subscription = await currentSubscription();
  if (subscription) await sendToCore(subscription).catch(() => undefined);
}

/** Antes de cerrar sesión: este teléfono deja de recibir los avisos de esa cuenta. */
export async function forgetPushSubscriptionOnSignOut(): Promise<void> {
  try {
    await disablePushNotifications();
  } catch {
    // Cerrar sesión no puede fallar por esto.
  }
}
