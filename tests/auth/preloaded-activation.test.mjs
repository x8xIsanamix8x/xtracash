import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIVATION_DOCUMENT_MAX_BYTES,
  keepActivationDigits,
  normalizeActivationName,
  validateActivationDetails,
  validateActivationDocument,
  validateActivationIdentity,
} from "../../src/features/preloaded-activation/validation.ts";
import { getActivationHeaders } from "../../src/features/preloaded-activation/server/activationHeaders.ts";

test("el header de activación se omite si Core acepta el valor por defecto y solo se añade con secreto configurado", () => {
  assert.deepEqual(getActivationHeaders(undefined), {});
  assert.deepEqual(getActivationHeaders("   "), {});
  assert.deepEqual(getActivationHeaders(" sandbox-secret "), { "X-Activation-Key": "sandbox-secret" });
});

test("la identidad acepta únicamente 5–9 dígitos y un correo con formato válido", () => {
  assert.deepEqual(validateActivationIdentity("12345678", "persona@example.test"), {});
  assert.equal(validateActivationIdentity("1234", "persona@example.test").cedula, "Ingresa una cédula de 5 a 9 números.");
  assert.ok(validateActivationIdentity("12345678", "sin-correo").correo);
  assert.equal(keepActivationDigits("V-12.345.678abc"), "12345678");
});

test("los datos editables requieren nombre, apellido y teléfono válidos", () => {
  assert.deepEqual(validateActivationDetails({ nombre: "Ana María", apellido: "Pérez-Gómez", telefono: "+58 414-1234567" }), {});
  assert.deepEqual(validateActivationDetails({ nombre: "Daysbel Katerine", apellido: "Alfonzo Rojas", telefono: "04125823664" }), {});
  assert.deepEqual(validateActivationDetails({ nombre: "\u200cDaysbel Katerine", apellido: "Alfonzo Rojas", telefono: "04125823664" }), {});
  assert.equal(normalizeActivationName("\u200cDaysbel Katerine\u200c"), "Daysbel Katerine");
  assert.ok(validateActivationDetails({ nombre: "", apellido: "Pérez", telefono: "04141234567" }).nombre);
  assert.ok(validateActivationDetails({ nombre: "Ana", apellido: "Pérez", telefono: "abc" }).telefono);
});

test("los documentos admiten JPEG, PNG o WEBP no vacíos de hasta 5 MB", () => {
  const file = (name, options) => new File([new Uint8Array([1])], name, options);
  assert.equal(validateActivationDocument(file("cedula.jpg", { type: "image/jpeg" })), null);
  assert.match(validateActivationDocument(file("cedula.gif", { type: "image/gif" })), /JPG, PNG o WEBP/);
  assert.match(validateActivationDocument(file("vacio.png", { type: "image/png" }).slice(0, 0)), /vacío/);
  const oversized = { name: "grande.png", size: ACTIVATION_DOCUMENT_MAX_BYTES + 1, type: "image/png" };
  assert.match(validateActivationDocument(oversized), /5 MB/);
});
