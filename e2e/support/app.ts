import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

import {
  combineInstallmentsOverview,
  parseCoreConsumptionDetail,
  parseCoreFinancings,
  parseCorePaymentData,
  parseCoreUnpaidInstallments,
} from "../../src/features/installments/server/coreContracts";

/** Respuestas reales de Core (sandbox, 24/09/2026). */
export function coreFixture<T = unknown>(name: string): T {
  return JSON.parse(
    readFileSync(path.join(__dirname, "../../tests/installments/fixtures", `${name}.json`), "utf8"),
  ) as T;
}

type CoreInstallmentsBody = { installments: Array<Record<string, unknown>> };
type CoreFinancingsBody = { financiamientos: Array<Record<string, unknown>> };

/**
 * Arma la respuesta de `GET /api/installments` con el mismo código del BFF, a partir de
 * las fixtures de Core. `edit` permite ajustar las cuotas antes (mora, en revisión...).
 */
export function installmentsOverview(
  edit: (core: { cuotas: CoreInstallmentsBody; financiamientos: CoreFinancingsBody }) => void = () => {},
) {
  const core = {
    cuotas: coreFixture<CoreInstallmentsBody>("cuotas"),
    financiamientos: coreFixture<CoreFinancingsBody>("financiamientos"),
  };
  edit(core);
  const financings = parseCoreFinancings(core.financiamientos);
  const unpaid = parseCoreUnpaidInstallments(core.cuotas);
  if (!financings || !unpaid) throw new Error("Fixture de Core inválida");
  return combineInstallmentsOverview(financings, unpaid);
}

type CoreDetailBody = {
  consumption: Record<string, unknown>;
  installments: Array<Record<string, unknown>>;
  debt: Record<string, unknown>;
};

/** Respuesta de `GET /api/installments/[id]` (Clínica), armada con el código del BFF. */
export function consumptionDetail(edit: (core: CoreDetailBody) => void = () => {}) {
  const core = coreFixture<CoreDetailBody>("consumo-detalle");
  edit(core);
  const detail = parseCoreConsumptionDetail(core);
  if (!detail) throw new Error("Fixture de Core inválida");
  return detail;
}

type CorePaymentDataBody = { consumption: Record<string, unknown> } & Record<string, unknown>;

/** Respuesta de `GET /api/installments/[id]/payment-data` (Clínica, a hoy). */
export function paymentData(edit: (core: CorePaymentDataBody) => void = () => {}) {
  const core = coreFixture<CorePaymentDataBody>("datos-pago-hoy");
  edit(core);
  const data = parseCorePaymentData(core, [
    { code: "0102", name: "Banco de Venezuela" },
    { code: "0105", name: "Mercantil" },
    { code: "0134", name: "Banesco" },
  ]);
  if (!data) throw new Error("Fixture de Core inválida");
  return data;
}

/** Una opción de pago de Core con `count` cuotas y el total indicado. */
export function coreOption(count: number, totalBs: string, lastDueDate = "2026-12-06") {
  const money = { bs: totalBs, usd: "1.00" };
  const zero = { bs: "0.00", usd: "0.00" };
  return {
    installmentCount: count,
    installments: Array.from({ length: count }, (_, index) => index + 1),
    lastDueDate,
    breakdown: { capital: money, interest: zero, lateFee: zero, reconnection: zero },
    total: money,
    interestFree: true,
  };
}

function signSessionMarker(secret: string) {
  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({
    version: 1,
    accessExpiresAt: now + 60 * 60 * 1000,
    refreshExpiresAt: now + 2 * 60 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

type JsonResponse = Readonly<{ status?: number; body: unknown }>;

export type BffMock = Readonly<{
  /** Responde una ruta del BFF (patrón glob de Playwright) con JSON. */
  respond: (pattern: string, response: JsonResponse | (() => JsonResponse)) => Promise<void>;
  /** Simula que se cae la conexión al pedir esa ruta. */
  disconnect: (pattern: string) => Promise<void>;
  /** Cuántas veces el navegador pidió una ruta del BFF. */
  calls: (pathname: string) => number;
}>;

export const test = base.extend<{ bff: BffMock }>({
  bff: async ({ context, baseURL }, provide) => {
    const secret = process.env.AUTH_SESSION_SECRET?.trim();
    if (!secret || secret.length < 32) {
      throw new Error("Las pruebas E2E necesitan AUTH_SESSION_SECRET en .env");
    }

    // Sesión válida para `proxy.ts`: los tokens son ficticios porque el BFF se simula.
    const url = baseURL!;
    await context.addCookies([
      { name: "impulsate-access", value: "e2e-access-token", url, httpOnly: true, sameSite: "Lax" },
      { name: "impulsate-refresh", value: "e2e-refresh-token", url, httpOnly: true, sameSite: "Lax" },
      { name: "impulsate-session", value: signSessionMarker(secret), url, httpOnly: true, sameSite: "Lax" },
    ]);

    const counts = new Map<string, number>();
    context.on("request", (request) => {
      const { pathname } = new URL(request.url());
      if (pathname.startsWith("/api/")) counts.set(pathname, (counts.get(pathname) ?? 0) + 1);
    });

    // Ninguna llamada de la app debe llegar a Core: lo no simulado responde 503.
    await context.route("**/api/**", (route: Route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/api/auth/session") return route.fallback();
      return route.fulfill({ status: 503, json: { error: "service_unavailable" } });
    });
    await context.route("**/api/home/summary", (route) => route.fulfill({ json: coreFixture("resumen") }));

    await provide({
      respond: async (pattern, response) => {
        await context.route(pattern, (route) => {
          const { status = 200, body } = typeof response === "function" ? response() : response;
          return route.fulfill({ status, json: body });
        });
      },
      disconnect: async (pattern) => {
        await context.route(pattern, (route) => route.abort("internetdisconnected"));
      },
      calls: (pathname) => counts.get(pathname) ?? 0,
    });
  },
});

export { expect };
export type { Page };
