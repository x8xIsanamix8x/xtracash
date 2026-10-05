import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

import {
  parsePushSubscription,
  resolvePushStatus,
  urlBase64ToUint8Array,
} from "../../src/features/notifications/push/pushContract.ts";

// IMOV-442: notificaciones push.

const base = { pushSupported: true, isIos: false, isStandalone: false, permission: "default", hasSubscription: false };

test("estado del dispositivo: se puede activar, ya activo, bloqueado o sin soporte", () => {
  assert.equal(resolvePushStatus(base), "off");
  assert.equal(resolvePushStatus({ ...base, permission: "granted", hasSubscription: true }), "on");
  assert.equal(resolvePushStatus({ ...base, permission: "granted", hasSubscription: false }), "off");
  assert.equal(resolvePushStatus({ ...base, permission: "denied" }), "denied");
  assert.equal(resolvePushStatus({ ...base, pushSupported: false }), "unsupported");
});

test("en iPhone solo hay push con la app instalada en la pantalla de inicio", () => {
  assert.equal(resolvePushStatus({ ...base, isIos: true, isStandalone: false }), "needs-install");
  assert.equal(resolvePushStatus({ ...base, isIos: true, isStandalone: true }), "off");
});

test("la clave publica VAPID base64url se convierte a los 65 bytes que pide el navegador", () => {
  const key = "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8";
  const bytes = urlBase64ToUint8Array(key);
  assert.equal(bytes.length, 65);
  assert.equal(bytes[0], 4);
  assert.equal(Buffer.from(bytes).toString("base64url"), key);
});

test("solo se reenvia al Core una suscripcion https con sus dos claves", () => {
  const valid = { endpoint: "https://fcm.googleapis.com/fcm/send/x", expirationTime: null, keys: { p256dh: "p", auth: "a" } };
  assert.deepEqual(parsePushSubscription(valid), { endpoint: valid.endpoint, keys: { p256dh: "p", auth: "a" } });
  assert.equal(parsePushSubscription({ ...valid, endpoint: "http://fcm.googleapis.com/x" }), null);
  assert.equal(parsePushSubscription({ endpoint: valid.endpoint, keys: { p256dh: "p" } }), null);
  assert.equal(parsePushSubscription(null), null);
});

// El service worker real, en un contexto simulado.
const source = await readFile(new URL("../../public/sw.js", import.meta.url), "utf8");

function worker({ windows = [] } = {}) {
  const handlers = new Map();
  const shown = [];
  const opened = [];
  const context = {
    URL, Response, console,
    self: {
      location: { origin: "https://app.example.test" },
      addEventListener: (name, handler) => handlers.set(name, handler),
      registration: { showNotification: async (title, options) => { shown.push({ title, options }); } },
      clients: {
        matchAll: async () => windows,
        openWindow: async (url) => { opened.push(url); },
      },
      skipWaiting() {},
    },
    caches: {},
    fetch: async () => new Response(null),
  };
  runInNewContext(source, context);
  return {
    shown,
    opened,
    async push(data) {
      let done;
      handlers.get("push")({ data, waitUntil(promise) { done = promise; } });
      await done;
    },
    async click(url) {
      let done;
      const notification = { data: { url }, closed: false, close() { this.closed = true; } };
      handlers.get("notificationclick")({ notification, waitUntil(promise) { done = promise; } });
      await done;
      return notification;
    },
  };
}

function client(url) {
  return {
    url, messages: [], focused: false, navigatedTo: null,
    postMessage(message) { this.messages.push(message); },
    async focus() { this.focused = true; },
    async navigate(target) { this.navigatedTo = target; },
  };
}

test("al llegar un push muestra la notificacion con el asunto, sin montos, y avisa a la app abierta", async () => {
  const open = client("https://app.example.test/home");
  const sw = worker({ windows: [open] });

  await sw.push({ json: () => ({ id: "n-1", type: "REPORTE_PAGO_APROBADO", title: "Tu pago fue aprobado",
    body: "Abre Impúlsate Móvil para ver el detalle.", url: "/notifications" }) });

  assert.equal(sw.shown.length, 1);
  assert.equal(sw.shown[0].title, "Tu pago fue aprobado");
  assert.equal(sw.shown[0].options.body, "Abre Impúlsate Móvil para ver el detalle.");
  assert.equal(sw.shown[0].options.tag, "n-1");
  assert.equal(sw.shown[0].options.data.url, "/notifications");
  assert.equal(JSON.stringify(open.messages), JSON.stringify([{ type: "INBOX_UPDATED" }]));
});

test("un push ilegible o con una URL externa muestra el aviso generico y abre la bandeja", async () => {
  const sw = worker();
  await sw.push({ json: () => { throw new SyntaxError("no es json"); } });
  await sw.push({ json: () => ({ title: "Hola", url: "https://otro-sitio.test/robo" }) });

  assert.equal(sw.shown[0].title, "Impúlsate Móvil");
  assert.equal(sw.shown[1].options.data.url, "/notifications");
});

test("tocar la notificacion lleva a la app ya abierta, o la abre si estaba cerrada", async () => {
  const open = client("https://app.example.test/home");
  const conApp = worker({ windows: [open] });
  const notification = await conApp.click("/notifications");
  assert.equal(notification.closed, true);
  assert.equal(open.focused, true);
  assert.equal(open.navigatedTo, "https://app.example.test/notifications");

  const sinApp = worker();
  await sinApp.click("/notifications");
  assert.deepEqual(sinApp.opened, ["https://app.example.test/notifications"]);
});
