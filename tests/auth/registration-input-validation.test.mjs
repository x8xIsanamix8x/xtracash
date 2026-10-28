import assert from "node:assert/strict";
import test from "node:test";

import { createRegistrationRequest } from "../../src/features/auth/registration/registrationRequest.ts";
import {
  DOCUMENT_MAX_LENGTH,
  keepAsciiDigits,
  validateDocumentNumber,
  validateEmail,
  validatePersonName,
  validatePhone,
} from "../../src/features/auth/registration/validation.ts";

test("filtra escritura, pegado y autocompletado numérico conservando ceros iniciales", () => {
  assert.equal(keepAsciiDigits("00A12-34🙂56", DOCUMENT_MAX_LENGTH), "00123456");
  assert.equal(keepAsciiDigits("０１２345", DOCUMENT_MAX_LENGTH), "345");
  assert.equal(keepAsciiDigits("123456789", DOCUMENT_MAX_LENGTH), "12345678");
});

test("valida documento vacío, longitud y dígitos ASCII", () => {
  assert.equal(validateDocumentNumber(""), "Ingresa tu número de cédula.");
  assert.equal(validateDocumentNumber("12345"), "Ingresa una cédula de 6 a 8 dígitos.");
  assert.equal(
    validateDocumentNumber("123A56"),
    "La cédula solo puede contener números del 0 al 9.",
  );
  assert.equal(validateDocumentNumber("00123456"), undefined);
});

test("acepta nombres Unicode, compuestos, con guiones y apóstrofes", () => {
  const validNames = [
    "José Manuel",
    "María de los Ángeles",
    "Jean-Pierre",
    "D'Angelo",
    "O’Connor",
    "Gonçalves Delgado",
    "De Sousa",
  ];

  for (const name of validNames) {
    assert.equal(validatePersonName(name, "Requerido"), undefined);
  }
});

test("rechaza nombres vacíos, números, emojis y símbolos no permitidos", () => {
  assert.equal(validatePersonName("   ", "Ingresa tus nombres."), "Ingresa tus nombres.");
  for (const name of ["María2", "José 🙂", "Ana_María", "Carlos@Pérez", "-María"]) {
    assert.equal(
      validatePersonName(name, "Requerido"),
      "Utiliza únicamente letras, espacios, guiones o apóstrofes.",
    );
  }
});

test("valida teléfono como string móvil venezolano de once dígitos", () => {
  assert.equal(keepAsciiDigits("04A12-1234567", 11), "04121234567");
  assert.equal(validatePhone("04121234567"), undefined);
  assert.equal(validatePhone("02121234567"), "Ingresa un teléfono móvil venezolano válido.");
  assert.equal(
    validatePhone("0412A234567"),
    "El teléfono solo puede contener números del 0 al 9.",
  );
});

test("valida un único correo y tolera únicamente espacios exteriores", () => {
  assert.equal(validateEmail(" persona@ejemplo.com "), undefined);
  assert.equal(validateEmail(""), "Ingresa un correo electrónico válido");
  assert.equal(validateEmail("persona@"), "Ingresa un correo electrónico válido");
  assert.equal(
    validateEmail("uno@ejemplo.com,dos@ejemplo.com"),
    "Ingresa un correo electrónico válido",
  );
});

test("preserva strings, ceros iniciales y espacios internos en el DTO", () => {
  const request = createRegistrationRequest(
    {
      nationality: "V",
      documentNumber: "00123456",
      firstName: "  María  de los Ángeles  ",
      lastName: "  D'Angelo  ",
      phone: "04121234567",
      email: " Persona@Ejemplo.com ",
      password: "Segura1!",
      passwordConfirmation: "Segura1!",
    },
    true,
  );

  assert.equal(request.documentNumber, "00123456");
  assert.equal(request.name, "María  de los Ángeles");
  assert.equal(request.lastName, "D'Angelo");
  assert.equal(request.phone, "04121234567");
  assert.equal(request.email, "persona@ejemplo.com");
});
