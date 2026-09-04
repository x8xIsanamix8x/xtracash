import type { BiometricAccessIntegration } from "./types";

/**
 * La integración permanecerá ausente hasta que existan rutas BFF same-origin
 * confirmadas para las ceremonias gestionadas por Keycloak.
 */
export function getBiometricAccessIntegration(): BiometricAccessIntegration | null {
  return null;
}

const unavailablePreviewAction: BiometricAccessIntegration["authenticate"] =
  async () => {
    throw new Error("biometric-integration-not-configured");
  };

const previewIntegration: BiometricAccessIntegration = {
  activate: unavailablePreviewAction,
  authenticate: unavailablePreviewAction,
  deactivate: unavailablePreviewAction,
};

/**
 * Permite revisar la presentación local sin habilitarla en builds desplegados
 * ni simular una autenticación satisfactoria.
 */
export function getBiometricAccessPreviewIntegration(
  nodeEnv = process.env.NODE_ENV,
): BiometricAccessIntegration | null {
  return nodeEnv === "development" ? previewIntegration : null;
}
