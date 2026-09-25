// Migradas de tests/payment-report al retirar el flujo viejo (SPEC-08): el comprobante del
// reporte de cuotas usa las mismas reglas.
import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const {
  getPaymentSupportErrorMessage,
  isSafePaymentSupportFilename,
  MAX_PAYMENT_SUPPORT_BYTES,
  validatePaymentSupportFileMetadata,
} = await import("../../src/features/installments/paymentSupport.ts");
const { parsePaymentSupport } = await import(
  "../../src/features/installments/server/paymentSupportValidation.ts"
);

const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdfBytes = Buffer.from("%PDF-1.7\n");

function receiptPayload(fileName, bytes) {
  return { fileName, contentBase64: bytes.toString("base64") };
}

test("valida metadatos en el navegador para JPG, JPEG, PNG y PDF", () => {
  for (const [name, type] of [
    ["comprobante.jpg", "image/jpeg"],
    ["comprobante.jpeg", "image/jpeg"],
    ["comprobante.png", "image/png"],
    ["comprobante.pdf", "application/pdf"],
    ["comprobante.pdf", ""],
  ]) {
    assert.equal(validatePaymentSupportFileMetadata({ name, size: 1024, type }), null, name);
  }
});

test("rechaza archivo vacío, exceso de tamaño, extensión y MIME falsos", () => {
  assert.equal(
    validatePaymentSupportFileMetadata({ name: "comprobante.pdf", size: 0, type: "application/pdf" }),
    "unreadable",
  );
  assert.equal(
    validatePaymentSupportFileMetadata({
      name: "comprobante.pdf",
      size: MAX_PAYMENT_SUPPORT_BYTES + 1,
      type: "application/pdf",
    }),
    "too_large",
  );
  assert.equal(
    validatePaymentSupportFileMetadata({ name: "comprobante.svg", size: 10, type: "image/svg+xml" }),
    "invalid_type",
  );
  assert.equal(
    validatePaymentSupportFileMetadata({ name: "comprobante.pdf", size: 10, type: "image/png" }),
    "invalid_type",
  );
  assert.equal(getPaymentSupportErrorMessage("too_large"), "El archivo no puede superar los 5 MB.");
  assert.equal(getPaymentSupportErrorMessage("invalid_type"), "Adjunta un archivo JPG, PNG o PDF.");
});

test("el BFF valida las firmas JPEG, PNG y PDF y acepta exactamente 5 MiB", () => {
  assert.equal(parsePaymentSupport(receiptPayload("comprobante.jpg", jpegBytes)).ok, true);
  assert.equal(parsePaymentSupport(receiptPayload("comprobante.jpeg", jpegBytes)).ok, true);
  assert.equal(parsePaymentSupport(receiptPayload("comprobante.png", pngBytes)).ok, true);
  assert.equal(parsePaymentSupport(receiptPayload("comprobante.pdf", pdfBytes)).ok, true);

  const limitBytes = Buffer.alloc(MAX_PAYMENT_SUPPORT_BYTES);
  jpegBytes.copy(limitBytes, 0);
  assert.equal(parsePaymentSupport(receiptPayload("limite.jpg", limitBytes)).ok, true);

  const receipt = receiptPayload("comprobante.pdf", pdfBytes);
  assert.deepEqual(parsePaymentSupport(receipt), { ok: true, value: receipt });
});

test("rechaza Base64 inválido, Data URL, firma incorrecta y más de 5 MiB", () => {
  for (const contentBase64 of [
    "%%%",
    "data:application/pdf;base64,JVBERi0=",
    "",
    `${pdfBytes.toString("base64")}\n`,
  ]) {
    assert.deepEqual(
      parsePaymentSupport({ fileName: "comprobante.pdf", contentBase64 }),
      { ok: false, error: "invalid" },
      contentBase64,
    );
  }
  assert.deepEqual(
    parsePaymentSupport(receiptPayload("comprobante.pdf", pngBytes)),
    { ok: false, error: "invalid" },
  );

  const oversizedBytes = Buffer.alloc(MAX_PAYMENT_SUPPORT_BYTES + 1);
  jpegBytes.copy(oversizedBytes, 0);
  assert.deepEqual(
    parsePaymentSupport(receiptPayload("grande.jpg", oversizedBytes)),
    { ok: false, error: "too_large" },
  );
});

test("rechaza rutas, controles, campos extra, nombres del contrato viejo y doble extensión peligrosa", () => {
  assert.equal(isSafePaymentSupportFilename("comprobante.final.pdf"), true);
  assert.equal(isSafePaymentSupportFilename("../comprobante.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("carpeta\\comprobante.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante\n.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante.exe.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante.exe.final.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante.pdf".padStart(256, "a")), false);

  assert.deepEqual(
    parsePaymentSupport({ ...receiptPayload("comprobante.pdf", pdfBytes), mime: "application/pdf" }),
    { ok: false, error: "invalid" },
  );
  assert.deepEqual(
    parsePaymentSupport({ nombreArchivo: "comprobante.pdf", contenidoBase64: pdfBytes.toString("base64") }),
    { ok: false, error: "invalid" },
  );
});
