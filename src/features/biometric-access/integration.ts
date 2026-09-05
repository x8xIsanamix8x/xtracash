"use client";

import { login, LoginServiceError } from "../auth/login/services/login";
import { getProfilePersonalInfo, ProfileServiceError } from "../profile/services/profile";
import { createVault, deleteVault, hasVault, unlockVault, VaultError } from "./client/vault";
import { BiometricPrototypeError, createBiometricVaultService } from "./client/vaultService";
import { isBiometricPrototypeBrowserAllowed } from "./config";

export { clearEnrollmentCredentials } from "./client/vaultService";
export type { EnrollmentCredentials } from "./client/vaultService";

const service = createBiometricVaultService({
  guard: () => {
    if (!isBiometricPrototypeBrowserAllowed()) throw new BiometricPrototypeError("unavailable");
  },
  now: Date.now,
  profile: getProfilePersonalInfo,
  login,
  create: createVault,
  unlock: unlockVault,
  has: hasVault,
  remove: deleteVault,
});

export const verifyEnrollmentPassword = service.verify;
export const activateBiometricVault = service.activate;
export const authenticateBiometricVault = service.authenticate;
export const hasBiometricVault = service.has;
export const deactivateBiometricVault = service.deactivate;

export function getBiometricVaultErrorMessage(error: unknown): string {
  if (error instanceof LoginServiceError) {
    if (error.type === "invalidCredentials") return "Core no aceptó la contraseña. Ingresa con tu contraseña actual y vuelve a configurar el acceso biométrico.";
    if (error.type === "aborted") return "La solicitud se interrumpió. Puedes intentarlo nuevamente.";
    return "No pudimos iniciar sesión. Revisa tu conexión e inténtalo nuevamente. Tu configuración no se ha eliminado.";
  }
  if (error instanceof ProfileServiceError) return "No pudimos verificar tu cuenta. Vuelve a ingresar con tu contraseña.";
  if (error instanceof BiometricPrototypeError) {
    if (error.type === "expired") return "La verificación venció. Confirma nuevamente tu contraseña.";
    if (error.type === "account") return "La cuenta cambió. Cierra este panel y vuelve a intentarlo.";
    if (error.type === "password") return "Ingresa tu contraseña actual.";
    if (error.type === "busy") return "Ya hay una solicitud en curso.";
    return "Este prototipo solo está disponible en el ambiente de pruebas autorizado.";
  }
  if (error instanceof VaultError) {
    if (error.type === "missing") return "Configura el acceso biométrico desde Perfil en este navegador.";
    if (error.type === "unavailable") return "Este dispositivo o proveedor de passkeys no admite el cifrado requerido (PRF). Usa tu contraseña.";
    if (error.type === "storage") return "No pudimos acceder al almacenamiento de este navegador. Usa tu contraseña.";
    if (error.type === "busy") return "Ya hay una solicitud biométrica en curso.";
    return "No pudimos abrir la configuración cifrada. Ingresa con contraseña para quitarla y configurarla nuevamente.";
  }
  if (error instanceof DOMException && ["NotAllowedError", "AbortError"].includes(error.name)) {
    return "La solicitud se canceló o venció. Puedes intentarlo nuevamente.";
  }
  return "No pudimos completar el acceso biométrico. Puedes ingresar con tu contraseña.";
}
