import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCoreProfilePersonalInfo,
  parseProfilePersonalInfo,
} from "../../src/features/profile/contractValidation.ts";
import {
  createProfileData,
  formatProfileDocument,
  formatProfilePhone,
  getProfileInitials,
} from "../../src/features/profile/presentation.ts";

const corePayload = {
  fullName: "Leonardo Reveron",
  document: {
    type: "V",
    number: "5416169",
  },
  email: "lmelo@impulsatechs.com",
  phone: "04222855007",
  ignoredField: "No debe exponerse",
};

test("sanea la respuesta real de Core al DTO mínimo", () => {
  assert.deepEqual(parseCoreProfilePersonalInfo(corePayload), {
    fullName: "Leonardo Reveron",
    documentType: "V",
    documentNumber: "5416169",
    email: "lmelo@impulsatechs.com",
    phone: "04222855007",
  });
});

test("deriva iniciales desde un nombre compuesto", () => {
  assert.equal(getProfileInitials("María de los Ángeles Pérez"), "MP");
  assert.equal(getProfileInitials("Leonardo"), "LE");
});

test("presenta tipos documentales distintos de V sin alterar el canónico", () => {
  const personalInfo = parseCoreProfilePersonalInfo({
    ...corePayload,
    document: { type: "E", number: "5416169" },
  });
  assert.notEqual(personalInfo, null);
  if (personalInfo === null) assert.fail("Se esperaba información válida");

  assert.equal(personalInfo.documentType, "E");
  assert.equal(personalInfo.documentNumber, "5416169");
  assert.equal(formatProfileDocument(
    personalInfo.documentType,
    personalInfo.documentNumber,
  ), "E-5.416.169");
});

test("formatea teléfono solo para presentación", () => {
  assert.equal(formatProfilePhone("04222855007"), "0422 285 5007");
  assert.equal(formatProfilePhone("584222855007123"), "584222855007123");
});

test("conserva documentos largos como strings", () => {
  assert.equal(
    formatProfileDocument("P", "12345678901234567890"),
    "P-12.345.678.901.234.567.890",
  );
});

test("rechaza payloads incompletos y correos inválidos", () => {
  assert.equal(parseCoreProfilePersonalInfo({
    ...corePayload,
    document: { type: "V" },
  }), null);
  assert.equal(parseCoreProfilePersonalInfo({
    ...corePayload,
    email: "correo-invalido",
  }), null);
});

test("mantiene estricta la validación del DTO del navegador", () => {
  const dto = parseCoreProfilePersonalInfo(corePayload);
  assert.notEqual(dto, null);
  if (dto === null) assert.fail("Se esperaba un DTO válido");

  assert.deepEqual(parseProfilePersonalInfo(dto), dto);
  assert.equal(parseProfilePersonalInfo({
    ...dto,
    email: "sin-arroba.example.com",
  }), null);
});

test("crea exclusivamente la presentación derivada", () => {
  const dto = parseCoreProfilePersonalInfo(corePayload);
  assert.notEqual(dto, null);
  if (dto === null) assert.fail("Se esperaba un DTO válido");

  assert.deepEqual(createProfileData(dto), {
    fullName: "Leonardo Reveron",
    initials: "LR",
    document: "V-5.416.169",
    email: "lmelo@impulsatechs.com",
    phone: "0422 285 5007",
  });
});
