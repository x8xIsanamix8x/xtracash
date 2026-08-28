import assert from "node:assert/strict";
import test from "node:test";

import { createRegistrationRequest } from "../../src/features/auth/registration/registrationRequest.ts";
import { validateIdentification } from "../../src/features/auth/registration/validation.ts";

const validData = {
  nationality: "V",
  documentNumber: "12345678",
  firstName: "María José",
  lastName: "O'Connor-Peña",
  phone: "04121234567",
  email: "persona@ejemplo.com",
  password: "Segura1!",
  passwordConfirmation: "Segura1!",
};

test("exige nacionalidad, nombres y apellidos con los mensajes aprobados", () => {
  assert.deepEqual(
    validateIdentification({
      ...validData,
      nationality: "",
      firstName: "   ",
      lastName: "\t",
    }),
    {
      nationality: "Selecciona tu nacionalidad",
      firstName: "Ingresa tus nombres",
      lastName: "Ingresa tus apellidos",
    },
  );
});

test("acepta nombres compuestos, acentos, eñes, apóstrofes y guiones", () => {
  assert.deepEqual(validateIdentification(validData), {});
  assert.deepEqual(
    validateIdentification({
      ...validData,
      nationality: "E",
      firstName: "Ana-María del Carmen",
      lastName: "Muñoz D'Ávila",
    }),
    {},
  );
});

test("conserva los valores V/E para Core y solo recorta los bordes de los nombres", () => {
  assert.deepEqual(
    createRegistrationRequest(
      {
        ...validData,
        nationality: "E",
        firstName: "  Ana  María  ",
        lastName: "  D'Ávila-Peña  ",
      },
      true,
    ),
    {
      documentType: "E",
      documentNumber: "12345678",
      name: "Ana  María",
      lastName: "D'Ávila-Peña",
      phone: "04121234567",
      email: "persona@ejemplo.com",
      password: "Segura1!",
      termsAccepted: true,
    },
  );
});

test("impide construir una solicitud sin nacionalidad", () => {
  assert.throws(
    () => createRegistrationRequest({ ...validData, nationality: "" }, true),
    /invalid-registration-nationality/,
  );
});
