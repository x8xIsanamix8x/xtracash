import type { LoginData, LoginErrors } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLoginIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function validateLogin(data: LoginData): LoginErrors {
  const errors: LoginErrors = {};
  const identifier = normalizeLoginIdentifier(data.identifier);

  if (!identifier) {
    errors.identifier = "Ingresa tu correo electrónico.";
  } else if (!emailPattern.test(identifier)) {
    errors.identifier = "Ingresa un correo electrónico válido.";
  }

  if (!data.password) {
    errors.password = "Ingresa tu contraseña.";
  }

  return errors;
}
