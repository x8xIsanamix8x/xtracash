export const TERMS_DEMO_ENABLED = process.env.NODE_ENV !== "production";

export const DEMO_TERMS_VERSION = "demo-2026-11";
export const DEMO_TERMS_TEXT = `TÉRMINOS Y CONDICIONES — DEMOSTRACIÓN\n\nEste texto es únicamente de prueba y no constituye una versión legal vigente. La integración con los servicios de consulta y registro de aceptación está pendiente del backend.\n\nAl aceptar en este modo, la aplicación solo simula el desbloqueo en este navegador. No se registra una aceptación legal.`;

export function getDemoTermsPending(): boolean {
  if (!TERMS_DEMO_ENABLED || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("termsDemo") === "pending";
}
