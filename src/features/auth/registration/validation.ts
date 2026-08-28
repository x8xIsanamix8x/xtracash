import type { RegistrationData, RegistrationErrors } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PasswordRule = Readonly<{
  label: string;
  helpText?: string;
  test: (value: string) => boolean;
}>;

export const passwordRules: readonly PasswordRule[] = [
  { label: "8 caracteres como mínimo", test: (value: string) => value.length >= 8 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /\d/.test(value) },
  {
    label: "Un carácter especial",
    helpText: "Por ejemplo: ! @ # $ % ^ & * ( ) _ +",
    test: (value: string) => /[^\p{L}\p{N}\s]/u.test(value),
  },
];

export function validateIdentification(data: RegistrationData): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const normalizedDocument = data.documentNumber.trim();

  if (data.nationality !== "V" && data.nationality !== "E") {
    errors.nationality = "Selecciona tu nacionalidad";
  }

  if (!/^\d{6,8}$/.test(normalizedDocument)) {
    errors.documentNumber = "Ingresa una cédula de 6 a 8 dígitos.";
  }

  if (!data.firstName.trim()) {
    errors.firstName = "Ingresa tus nombres";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Ingresa tus apellidos";
  }

  return errors;
}

export function validateContact(data: RegistrationData): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!/^04(12|14|16|22|24|26)\d{7}$/.test(data.phone.trim())) {
    errors.phone = "Ingresa un teléfono móvil venezolano válido.";
  }

  if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (!passwordRules.every((rule) => rule.test(data.password))) {
    errors.password = "La contraseña debe cumplir las cinco reglas indicadas.";
  }

  if (!data.passwordConfirmation) {
    errors.passwordConfirmation = "Confirma tu contraseña.";
  } else if (data.passwordConfirmation !== data.password) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  return errors;
}
