import type { RegistrationData, RegistrationErrors, RegistrationField } from "./types";

export const DOCUMENT_MIN_LENGTH = 6;
export const DOCUMENT_MAX_LENGTH = 8;
export const PHONE_LENGTH = 11;

const asciiDigitsPattern = /^[0-9]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const venezuelanMobilePattern = /^04(12|14|16|22|24|26)[0-9]{7}$/;
const personNamePattern = /^\p{L}[\p{L}\p{M}]*(?:[-'’]\p{L}[\p{L}\p{M}]*)*(?: +\p{L}[\p{L}\p{M}]*(?:[-'’]\p{L}[\p{L}\p{M}]*)*)*$/u;

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

export function doPasswordsMatch(password: string, confirmation: string): boolean {
  return confirmation.length > 0 && confirmation === password;
}

export function getPasswordConfirmationError(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "Confirma tu contraseña.";
  if (!doPasswordsMatch(password, confirmation)) return "Las contraseñas no coinciden.";
  return undefined;
}

export function keepAsciiDigits(value: string, maxLength: number): string {
  return value.replace(/[^0-9]/g, "").slice(0, maxLength);
}

export function validateDocumentNumber(value: string): string | undefined {
  const normalized = value.trim();

  if (!normalized) return "Ingresa tu número de cédula.";
  if (!asciiDigitsPattern.test(normalized)) {
    return "La cédula solo puede contener números del 0 al 9.";
  }
  if (normalized.length < DOCUMENT_MIN_LENGTH || normalized.length > DOCUMENT_MAX_LENGTH) {
    return "Ingresa una cédula de 6 a 8 dígitos.";
  }
  return undefined;
}

export function validatePersonName(
  value: string,
  emptyMessage: string,
): string | undefined {
  const normalized = value.trim();

  if (!normalized) return emptyMessage;
  if (!personNamePattern.test(normalized)) {
    return "Utiliza únicamente letras, espacios, guiones o apóstrofes.";
  }
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  const normalized = value.trim();

  if (!normalized) return "Ingresa tu teléfono móvil.";
  if (!asciiDigitsPattern.test(normalized)) {
    return "El teléfono solo puede contener números del 0 al 9.";
  }
  if (!venezuelanMobilePattern.test(normalized)) {
    return "Ingresa un teléfono móvil venezolano válido.";
  }
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  return emailPattern.test(value.trim()) ? undefined : "Ingresa un correo electrónico válido";
}

export function validateRegistrationField(
  field: RegistrationField,
  data: RegistrationData,
): string | undefined {
  if (field === "nationality") {
    return data.nationality === "V" || data.nationality === "E"
      ? undefined
      : "Selecciona tu nacionalidad";
  }
  if (field === "documentNumber") return validateDocumentNumber(data.documentNumber);
  if (field === "firstName") return validatePersonName(data.firstName, "Ingresa tus nombres");
  if (field === "lastName") return validatePersonName(data.lastName, "Ingresa tus apellidos");
  if (field === "phone") return validatePhone(data.phone);
  if (field === "email") return validateEmail(data.email);
  if (field === "password") {
    return passwordRules.every((rule) => rule.test(data.password))
      ? undefined
      : "La contraseña debe cumplir las cinco reglas indicadas.";
  }
  if (field === "passwordConfirmation") {
    return getPasswordConfirmationError(data.password, data.passwordConfirmation);
  }
  return undefined;
}

function collectErrors(
  data: RegistrationData,
  fields: readonly RegistrationField[],
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  for (const field of fields) {
    const error = validateRegistrationField(field, data);
    if (error) errors[field] = error;
  }
  return errors;
}

const identificationFields = ["nationality", "documentNumber", "firstName", "lastName"] as const;
const contactFields = ["phone", "email", "password", "passwordConfirmation"] as const;

export function validateIdentification(data: RegistrationData): RegistrationErrors {
  return collectErrors(data, identificationFields);
}

export function validateContact(data: RegistrationData): RegistrationErrors {
  return collectErrors(data, contactFields);
}

export function isIdentificationStepValid(data: RegistrationData): boolean {
  return Object.keys(validateIdentification(data)).length === 0;
}

export function isContactStepValid(data: RegistrationData): boolean {
  return Object.keys(validateContact(data)).length === 0;
}
