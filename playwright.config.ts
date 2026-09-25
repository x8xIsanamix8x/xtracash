import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// La sesión E2E se firma con el mismo AUTH_SESSION_SECRET que usa el servidor.
if (existsSync(".env")) process.loadEnvFile(".env");

const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    locale: "es-VE",
    timezoneId: "America/Caracas",
    // Cada prueba queda grabada: video, traza (paso a paso) y captura final.
    video: "on",
    trace: "on",
    screenshot: "on",
  },
  projects: [
    {
      name: "movil",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    // Si ya hay un `npm run dev` corriendo en ese puerto, se reutiliza.
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
