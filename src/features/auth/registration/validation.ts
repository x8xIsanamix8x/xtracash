import { registrationMock } from "./mocks/registration";
import type { RegistrationData, RegistrationErrors } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const namePattern = /^\p{L}[\p{L}\p{M}]*(?: +\p{L}[\p{L}\p{M}]*)*$/u;

export const passwordRules = [
  { label: "8 caracteres como mínimo", test: (value: string) => value.length >= 8 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /\d/.test(value) },
] as const;

export function validateIdentification(data: RegistrationData): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (!/^\d{6,8}$/.test(data.documentNumber)) {
    errors.documentNumber = "Ingresa una cédula de 6 a 8 dígitos.";
  } else if (data.documentNumber === registrationMock.duplicateDocument) {
    errors.documentNumber = "Esta cédula ya se encuentra registrada.";
  }

  if (!namePattern.test(data.firstName)) {
    errors.firstName = "Ingresa únicamente letras y espacios.";
  }
  if (!namePattern.test(data.lastName)) {
    errors.lastName = "Ingresa únicamente letras y espacios.";
  }

  return errors;
}

export function validateContact(data: RegistrationData): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!/^\d{11}$/.test(data.phone)) {
    errors.phone = "Ingresa un teléfono de 11 dígitos.";
  }

  if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Ingresa un correo electrónico válido.";
  } else if (normalizedEmail === registrationMock.duplicateEmail) {
    errors.email = "Este correo electrónico ya se encuentra registrado.";
  }

  if (!passwordRules.every((rule) => rule.test(data.password))) {
    errors.password = "La contraseña debe cumplir las cuatro reglas indicadas.";
  }

  if (!data.passwordConfirmation) {
    errors.passwordConfirmation = "Confirma tu contraseña.";
  } else if (data.passwordConfirmation !== data.password) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  return errors;
}
