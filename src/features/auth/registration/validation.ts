import type {
  RegistrationData,
  RegistrationErrors,
  RegistrationUiField,
} from "./types";

export const DOCUMENT_MIN_LENGTH = 6;
export const DOCUMENT_MAX_LENGTH = 8;
export const MOBILE_OPERATOR_CODES = ["0412", "0414", "0416", "0422", "0424", "0426"] as const;
export const PHONE_LOCAL_LENGTH = 7;
export const PHONE_LENGTH = 11;

export type MobileOperatorCode = (typeof MOBILE_OPERATOR_CODES)[number];

export type RegistrationPhoneParts = Readonly<{
  operatorCode: MobileOperatorCode | "";
  localNumber: string;
}>;

export const emptyRegistrationPhone: RegistrationPhoneParts = {
  operatorCode: "",
  localNumber: "",
};

const asciiDigitsPattern = /^[0-9]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

export function isMobileOperatorCode(value: string): value is MobileOperatorCode {
  return MOBILE_OPERATOR_CODES.some((code) => code === value);
}

export function composeNationalPhone(parts: RegistrationPhoneParts): string {
  return `${parts.operatorCode}${parts.localNumber}`;
}

export function splitNationalPhone(phone: string): RegistrationPhoneParts {
  const operatorCode = phone.slice(0, 4);

  if (isMobileOperatorCode(operatorCode)) {
    return {
      operatorCode,
      localNumber: keepAsciiDigits(phone.slice(4), PHONE_LOCAL_LENGTH),
    };
  }

  return {
    operatorCode: "",
    localNumber: keepAsciiDigits(phone, PHONE_LOCAL_LENGTH),
  };
}

export function applyPhoneNumberInput(
  value: string,
  current: RegistrationPhoneParts,
): RegistrationPhoneParts {
  if (value.trim().startsWith("+58")) return current;

  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length === PHONE_LENGTH) {
    const completePhone = splitNationalPhone(digits);
    if (completePhone.operatorCode) return completePhone;
  }

  return {
    ...current,
    localNumber: digits.slice(0, PHONE_LOCAL_LENGTH),
  };
}

export function validatePhoneOperatorCode(value: string): string | undefined {
  if (!value) return "Selecciona el código de operadora";
  return isMobileOperatorCode(value) ? undefined : "Selecciona un código de operadora válido";
}

export function validatePhoneLocalNumber(value: string): string | undefined {
  if (!value) return "Ingresa tu número de teléfono";
  if (!/^[0-9]+$/.test(value)) return "El número solo puede contener dígitos del 0 al 9";
  return value.length === PHONE_LOCAL_LENGTH
    ? undefined
    : "Ingresa los 7 dígitos del teléfono";
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
  const parts = splitNationalPhone(normalized);
  if (
    normalized.length !== PHONE_LENGTH ||
    validatePhoneOperatorCode(parts.operatorCode) ||
    validatePhoneLocalNumber(parts.localNumber)
  ) {
    return "Ingresa un teléfono móvil venezolano válido.";
  }
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  return emailPattern.test(value.trim()) ? undefined : "Ingresa un correo electrónico válido";
}

export function validateRegistrationField(
  field: RegistrationUiField,
  data: RegistrationData,
  phoneParts: RegistrationPhoneParts = splitNationalPhone(data.phone),
): string | undefined {
  if (field === "nationality") {
    return data.nationality === "V" || data.nationality === "E"
      ? undefined
      : "Selecciona tu nacionalidad";
  }
  if (field === "documentNumber") return validateDocumentNumber(data.documentNumber);
  if (field === "firstName") return validatePersonName(data.firstName, "Ingresa tus nombres");
  if (field === "lastName") return validatePersonName(data.lastName, "Ingresa tus apellidos");
  if (field === "phoneOperatorCode") {
    return validatePhoneOperatorCode(phoneParts.operatorCode);
  }
  if (field === "phoneLocalNumber") {
    return validatePhoneLocalNumber(phoneParts.localNumber);
  }
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
  fields: readonly RegistrationUiField[],
  phoneParts?: RegistrationPhoneParts,
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  for (const field of fields) {
    const error = validateRegistrationField(field, data, phoneParts);
    if (error) errors[field] = error;
  }
  return errors;
}

const identificationFields = ["nationality", "documentNumber", "firstName", "lastName"] as const;
const contactFields = [
  "phoneOperatorCode",
  "phoneLocalNumber",
  "email",
  "password",
  "passwordConfirmation",
] as const;

export function validateIdentification(data: RegistrationData): RegistrationErrors {
  return collectErrors(data, identificationFields);
}

export function validateContact(
  data: RegistrationData,
  phoneParts: RegistrationPhoneParts = splitNationalPhone(data.phone),
): RegistrationErrors {
  return collectErrors(data, contactFields, phoneParts);
}

export function isIdentificationStepValid(data: RegistrationData): boolean {
  return Object.keys(validateIdentification(data)).length === 0;
}

export function isContactStepValid(
  data: RegistrationData,
  phoneParts: RegistrationPhoneParts = splitNationalPhone(data.phone),
): boolean {
  return Object.keys(validateContact(data, phoneParts)).length === 0;
}
