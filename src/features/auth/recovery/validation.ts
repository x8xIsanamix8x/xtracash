import type { RecoveryData, RecoveryErrors } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const recoveryPasswordRules = [
  { label: "8 caracteres como mínimo", test: (value: string) => value.length >= 8 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /\d/.test(value) },
] as const;

export function validateRecoveryIdentifier(identifier: string) {
  const value = identifier.trim();

  if (!value) {
    return "Ingresa tu correo o teléfono.";
  }

  const isValid = value.includes("@")
    ? emailPattern.test(value)
    : /^\d{11}$/.test(value);

  return isValid ? "" : "Ingresa un correo o teléfono válido.";
}

export function validateRecoveryCode(code: string) {
  if (!code) {
    return "Ingresa el código de validación.";
  }

  return /^\d{6}$/.test(code) ? "" : "Ingresa únicamente 6 dígitos.";
}

export function validateRecoveryPassword(data: RecoveryData): RecoveryErrors {
  const errors: RecoveryErrors = {};

  if (!recoveryPasswordRules.every((rule) => rule.test(data.password))) {
    errors.password = "La contraseña debe cumplir las cuatro reglas indicadas.";
  }

  if (!data.passwordConfirmation) {
    errors.passwordConfirmation = "Confirma tu contraseña.";
  } else if (data.passwordConfirmation !== data.password) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  return errors;
}
