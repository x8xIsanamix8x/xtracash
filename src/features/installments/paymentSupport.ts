export const MAX_PAYMENT_SUPPORT_BYTES = 5 * 1024 * 1024;
export const MAX_PAYMENT_SUPPORT_FILENAME_LENGTH = 255;
export const MAX_PAYMENT_REPORT_JSON_BYTES = 7 * 1024 * 1024;

export const PAYMENT_SUPPORT_ACCEPT =
  ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

export type PaymentSupportKind = "jpeg" | "pdf" | "png";
export type PaymentSupportValidationError =
  | "invalid_type"
  | "too_large"
  | "unreadable";

export type PaymentSupportFileMetadata = Readonly<{
  name: string;
  size: number;
  type: string;
}>;

const extensionKinds: Readonly<Record<string, PaymentSupportKind>> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  pdf: "pdf",
  png: "png",
};

const mimeKinds: Readonly<Record<string, PaymentSupportKind>> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpeg",
  "image/png": "png",
};

const unsafeIntermediateExtensionPattern =
  /(?:^|\.)(?:bat|cmd|com|docm?|exe|heic|html?|js|msi|pptm?|sh|svg|webp|xlsm?|zip)(?=\.|$)/iu;
const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f]/u;
const controlCharactersPattern = /[\u0000-\u001f\u007f-\u009f]/gu;

export function getPaymentSupportKindFromName(
  filename: string,
): PaymentSupportKind | null {
  const separatorIndex = filename.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex === filename.length - 1) return null;

  return extensionKinds[filename.slice(separatorIndex + 1).toLowerCase()] ?? null;
}

export function isSafePaymentSupportFilename(filename: string): boolean {
  const normalized = filename.trim();
  if (
    !normalized
    || normalized.length > MAX_PAYMENT_SUPPORT_FILENAME_LENGTH
    || normalized.includes("/")
    || normalized.includes("\\")
    || controlCharacterPattern.test(normalized)
  ) {
    return false;
  }

  const finalSeparatorIndex = normalized.lastIndexOf(".");
  if (finalSeparatorIndex <= 0) return false;
  const basename = normalized.slice(0, finalSeparatorIndex);
  return !unsafeIntermediateExtensionPattern.test(basename);
}

export function validatePaymentSupportFileMetadata(
  file: PaymentSupportFileMetadata,
): PaymentSupportValidationError | null {
  if (!Number.isSafeInteger(file.size) || file.size <= 0) return "unreadable";
  if (file.size > MAX_PAYMENT_SUPPORT_BYTES) return "too_large";
  if (!isSafePaymentSupportFilename(file.name)) return "invalid_type";

  const extensionKind = getPaymentSupportKindFromName(file.name);
  if (extensionKind === null) return "invalid_type";

  const normalizedMime = file.type.trim().toLowerCase();
  if (!normalizedMime) return null;

  return mimeKinds[normalizedMime] === extensionKind ? null : "invalid_type";
}

export function sanitizePaymentSupportDisplayName(filename: string): string {
  const withoutControls = filename
    .replace(controlCharactersPattern, "")
    .replace(/[\\/]+/gu, " ")
    .trim();
  const fallback = withoutControls || "Comprobante";
  if (fallback.length <= 72) return fallback;

  const separatorIndex = fallback.lastIndexOf(".");
  const extension = separatorIndex > 0 ? fallback.slice(separatorIndex) : "";
  const availableLength = Math.max(20, 69 - extension.length);
  return `${fallback.slice(0, availableLength)}…${extension}`;
}

export function formatPaymentSupportSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getPaymentSupportErrorMessage(
  error: PaymentSupportValidationError,
): string {
  if (error === "too_large") return "El archivo no puede superar los 5 MB.";
  if (error === "unreadable") {
    return "No pudimos leer el archivo. Selecciona otro e inténtalo nuevamente.";
  }
  return "Adjunta un archivo JPG, PNG o PDF.";
}
