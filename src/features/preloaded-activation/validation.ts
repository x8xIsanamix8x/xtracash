export const ACTIVATION_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const ACTIVATION_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ActivationDocumentKind = "cedula" | "rif";

export type ActivationFormValues = Readonly<{
  cedula: string;
  correo: string;
  nombre: string;
  apellido: string;
  telefono: string;
}>;

export type ActivationFormErrors = Partial<Record<keyof ActivationFormValues, string>>;

export function keepActivationDigits(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 9);
}

export function removeInvisibleNameCharacters(value: string): string {
  return value.normalize("NFKC").replace(/\p{Cf}/gu, "");
}

export function normalizeActivationName(value: string): string {
  return removeInvisibleNameCharacters(value).trim().replace(/\s+/gu, " ");
}

export function validateActivationIdentity(
  cedula: string,
  correo: string,
): ActivationFormErrors {
  const errors: ActivationFormErrors = {};
  const normalizedId = cedula.trim();

  if (!normalizedId) errors.cedula = "Ingresa tu número de cédula.";
  else if (!/^\d{5,9}$/.test(normalizedId)) {
    errors.cedula = "Ingresa una cédula de 5 a 9 números.";
  }

  const normalizedEmail = correo.trim();
  if (!normalizedEmail) errors.correo = "Ingresa el correo de tu invitación.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.correo = "Ingresa un correo electrónico válido.";
  }

  return errors;
}

export function validateActivationDetails(
  values: Pick<ActivationFormValues, "nombre" | "apellido" | "telefono">,
): ActivationFormErrors {
  const errors: ActivationFormErrors = {};
  const namePattern = /^\p{L}[\p{L}\p{M}]*(?:[-'’ ]\p{L}[\p{L}\p{M}]*)*$/u;

  const nombre = normalizeActivationName(values.nombre);
  const apellido = normalizeActivationName(values.apellido);

  if (!nombre) errors.nombre = "Ingresa tu nombre.";
  else if (!namePattern.test(nombre)) {
    errors.nombre = "Revisa el formato de tu nombre.";
  }

  if (!apellido) errors.apellido = "Ingresa tu apellido.";
  else if (!namePattern.test(apellido)) {
    errors.apellido = "Revisa el formato de tu apellido.";
  }

  if (!values.telefono.trim()) errors.telefono = "Ingresa tu número de teléfono.";
  else if (!/^[+0-9() -]{7,20}$/.test(values.telefono.trim())) {
    errors.telefono = "Revisa el formato del teléfono.";
  }

  return errors;
}

export function validateActivationDocument(file: File | null): string | null {
  if (!file) return "Adjunta este documento para continuar.";
  if (file.size <= 0) return "El archivo está vacío. Selecciona otra imagen.";
  if (file.size > ACTIVATION_DOCUMENT_MAX_BYTES) return "La imagen no puede superar 5 MB.";
  if (!ACTIVATION_DOCUMENT_TYPES.includes(file.type as (typeof ACTIVATION_DOCUMENT_TYPES)[number])) {
    return "Usa una imagen JPG, PNG o WEBP.";
  }
  return null;
}
