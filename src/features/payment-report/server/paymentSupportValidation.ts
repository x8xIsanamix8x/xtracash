import type { PaymentSupportKind } from "../paymentSupport";
import type { PaymentReportSupport } from "../types";

export type PaymentSupportParseError = "invalid" | "too_large";
export type PaymentSupportParseResult =
  | Readonly<{ ok: true; value: PaymentReportSupport }>
  | Readonly<{ error: PaymentSupportParseError; ok: false }>;

type PaymentSupportWireValue = Readonly<{
  contentBase64: string;
  fileName: string;
}>;

const MAX_PAYMENT_SUPPORT_BYTES = 5 * 1024 * 1024;
const MAX_PAYMENT_SUPPORT_FILENAME_LENGTH = 255;
const maximumBase64Length = 4 * Math.ceil(MAX_PAYMENT_SUPPORT_BYTES / 3);
const extensionKinds: Readonly<Record<string, PaymentSupportKind>> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  pdf: "pdf",
  png: "png",
};
const unsafeIntermediateExtensionPattern =
  /(?:^|\.)(?:bat|cmd|com|docm?|exe|heic|html?|js|msi|pptm?|sh|svg|webp|xlsm?|zip)(?=\.|$)/iu;
const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f]/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPaymentSupportKindFromName(
  filename: string,
): PaymentSupportKind | null {
  const separatorIndex = filename.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex === filename.length - 1) return null;

  return extensionKinds[filename.slice(separatorIndex + 1).toLowerCase()] ?? null;
}

function isSafePaymentSupportFilename(filename: string): boolean {
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
  return !unsafeIntermediateExtensionPattern.test(
    normalized.slice(0, finalSeparatorIndex),
  );
}

function detectPaymentSupportKind(bytes: Uint8Array): PaymentSupportKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d
  ) {
    return "pdf";
  }
  return null;
}

function decodeCanonicalBase64(value: string): Buffer | null {
  if (
    !value
    || value.length > maximumBase64Length
    || value.length % 4 !== 0
    || value.startsWith("data:")
  ) {
    return null;
  }

  const paddingLength = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const contentLength = value.length - paddingLength;
  if (value.slice(0, contentLength).includes("=")) return null;

  for (let index = 0; index < contentLength; index += 1) {
    const code = value.charCodeAt(index);
    const isBase64Character = (code >= 48 && code <= 57)
      || (code >= 65 && code <= 90)
      || (code >= 97 && code <= 122)
      || code === 43
      || code === 47;
    if (!isBase64Character) return null;
  }

  const decoded = Buffer.from(value, "base64");
  return decoded.toString("base64") === value ? decoded : null;
}

function validatePaymentSupport(
  value: PaymentSupportWireValue,
): PaymentSupportParseResult {
  const filename = value.fileName.trim();
  if (
    filename.length > MAX_PAYMENT_SUPPORT_FILENAME_LENGTH
    || !isSafePaymentSupportFilename(filename)
  ) {
    return { ok: false, error: "invalid" };
  }

  const decoded = decodeCanonicalBase64(value.contentBase64);
  if (decoded === null) {
    return value.contentBase64.length > maximumBase64Length
      ? { ok: false, error: "too_large" }
      : { ok: false, error: "invalid" };
  }
  if (decoded.length > MAX_PAYMENT_SUPPORT_BYTES) {
    return { ok: false, error: "too_large" };
  }
  if (decoded.length === 0) return { ok: false, error: "invalid" };

  const extensionKind = getPaymentSupportKindFromName(filename);
  const detectedKind = detectPaymentSupportKind(decoded);
  if (extensionKind === null || detectedKind === null || extensionKind !== detectedKind) {
    return { ok: false, error: "invalid" };
  }

  return {
    ok: true,
    value: {
      fileName: filename,
      contentBase64: value.contentBase64,
    },
  };
}

export function parsePaymentSupport(value: unknown): PaymentSupportParseResult {
  if (!isRecord(value)) return { ok: false, error: "invalid" };

  const keys = Object.keys(value).sort();
  if (
    keys.length !== 2
    || keys[0] !== "contentBase64"
    || keys[1] !== "fileName"
    || typeof value.fileName !== "string"
    || typeof value.contentBase64 !== "string"
  ) {
    return { ok: false, error: "invalid" };
  }

  return validatePaymentSupport({
    fileName: value.fileName,
    contentBase64: value.contentBase64,
  });
}

export function parseCorePaymentSupport(
  value: unknown,
): PaymentSupportParseResult {
  if (!isRecord(value)) return { ok: false, error: "invalid" };

  const keys = Object.keys(value).sort();
  if (
    keys.length !== 2
    || keys[0] !== "contenidoBase64"
    || keys[1] !== "nombreArchivo"
    || typeof value.nombreArchivo !== "string"
    || typeof value.contenidoBase64 !== "string"
  ) {
    return { ok: false, error: "invalid" };
  }

  return validatePaymentSupport({
    fileName: value.nombreArchivo,
    contentBase64: value.contenidoBase64,
  });
}

export function toCorePaymentSupport(support: PaymentReportSupport) {
  return {
    nombreArchivo: support.fileName,
    contenidoBase64: support.contentBase64,
  } as const;
}
