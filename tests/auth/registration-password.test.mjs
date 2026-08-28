import assert from "node:assert/strict";
import test from "node:test";

import {
  doPasswordsMatch,
  getPasswordConfirmationError,
  isContactStepValid,
  passwordRules,
} from "../../src/features/auth/registration/validation.ts";

const validContact = {
  nationality: "V",
  documentNumber: "12345678",
  firstName: "María José",
  lastName: "Gonçalves Delgado",
  phone: "04121234567",
  email: "persona@ejemplo.com",
  password: "Segura1!",
  passwordConfirmation: "Segura1!",
};

test("evalúa los cinco requisitos exclusivamente sobre la contraseña principal", () => {
  assert.deepEqual(passwordRules.map((rule) => rule.test("Segura1!")), [true, true, true, true, true]);
  assert.deepEqual(passwordRules.map((rule) => rule.test("Segura")), [false, true, true, false, false]);
});

test("mantiene pendiente la coincidencia con confirmación vacía o diferente", () => {
  assert.equal(doPasswordsMatch("Segura1!", ""), false);
  assert.equal(doPasswordsMatch("Segura1!", "Distinta1!"), false);
  assert.equal(doPasswordsMatch("Segura1!", "Segura1!"), true);
  assert.equal(doPasswordsMatch("Cambiada1!", "Segura1!"), false);
});

test("devuelve errores claros para confirmación vacía o diferente", () => {
  assert.equal(getPasswordConfirmationError("Segura1!", ""), "Confirma tu contraseña.");
  assert.equal(
    getPasswordConfirmationError("Segura1!", "Distinta1!"),
    "Las contraseñas no coinciden.",
  );
  assert.equal(getPasswordConfirmationError("Segura1!", "Segura1!"), undefined);
});

test("habilita el paso únicamente cuando todos sus campos son válidos", () => {
  assert.equal(isContactStepValid(validContact), true);
  assert.equal(isContactStepValid({ ...validContact, password: "Segura" }), false);
  assert.equal(isContactStepValid({ ...validContact, passwordConfirmation: "" }), false);
  assert.equal(isContactStepValid({ ...validContact, passwordConfirmation: "Distinta1!" }), false);
  assert.equal(isContactStepValid({ ...validContact, email: "correo-invalido" }), false);
  assert.equal(isContactStepValid({ ...validContact, phone: "0412" }), false);
});
