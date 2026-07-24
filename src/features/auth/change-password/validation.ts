import type { ChangePasswordData, ChangePasswordErrors } from "./types";

export const changePasswordRules = [
  { label: "8 caracteres como mínimo", test: (value: string) => value.length >= 8 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /\d/.test(value) },
] as const;

export function validateCurrentPassword(value: string) {
  return value.trim() ? "" : "Ingresa tu contraseña actual.";
}

export function validateVerificationCode(value: string) {
  if (!value) {
    return "Ingresa el código de validación.";
  }

  return /^\d{6}$/.test(value) ? "" : "Ingresa únicamente 6 dígitos.";
}

export function validateNewPassword(data: ChangePasswordData): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {};

  if (!changePasswordRules.every((rule) => rule.test(data.newPassword))) {
    errors.newPassword = "La contraseña debe cumplir las cuatro reglas indicadas.";
  }

  if (!data.passwordConfirmation) {
    errors.passwordConfirmation = "Confirma tu contraseña.";
  } else if (data.passwordConfirmation !== data.newPassword) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  return errors;
}
