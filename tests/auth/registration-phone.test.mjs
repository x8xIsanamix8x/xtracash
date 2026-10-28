import assert from "node:assert/strict";
import test from "node:test";

import {
  applyPhoneNumberInput,
  composeNationalPhone,
  emptyRegistrationPhone,
  MOBILE_OPERATOR_CODES,
  splitNationalPhone,
  validatePhoneLocalNumber,
  validatePhoneOperatorCode,
  validatePhone,
} from "../../src/features/auth/registration/validation.ts";

test("mantiene una única lista canónica con los seis códigos admitidos", () => {
  assert.deepEqual(MOBILE_OPERATOR_CODES, ["0412", "0414", "0416", "0422", "0424", "0426"]);
});

test("exige seleccionar código y completar exactamente siete dígitos", () => {
  assert.equal(validatePhoneOperatorCode(""), "Selecciona el código de operadora");
  assert.equal(validatePhoneOperatorCode("0212"), "Selecciona un código de operadora válido");
  assert.equal(validatePhoneLocalNumber(""), "Ingresa tu número de teléfono");
  assert.equal(validatePhoneLocalNumber("123456"), "Ingresa los 7 dígitos del teléfono");
  assert.equal(validatePhoneLocalNumber("12345678"), "Ingresa los 7 dígitos del teléfono");
  assert.equal(validatePhoneLocalNumber("1234567"), undefined);
});

test("compone y valida el string nacional para cada código permitido", () => {
  for (const operatorCode of MOBILE_OPERATOR_CODES) {
    const phone = composeNationalPhone({ operatorCode, localNumber: "1234567" });
    assert.equal(phone, `${operatorCode}1234567`);
    assert.equal(validatePhone(phone), undefined);
  }
});

test("filtra escritura y pegado local preservando ceros iniciales", () => {
  const current = { operatorCode: "0414", localNumber: "" };
  assert.deepEqual(applyPhoneNumberInput("0012A-345", current), {
    operatorCode: "0414",
    localNumber: "0012345",
  });
  assert.deepEqual(applyPhoneNumberInput("123456789", current), {
    operatorCode: "0414",
    localNumber: "1234567",
  });
});

test("divide automáticamente un teléfono nacional completo permitido", () => {
  assert.deepEqual(applyPhoneNumberInput("04241234567", emptyRegistrationPhone), {
    operatorCode: "0424",
    localNumber: "1234567",
  });
  assert.deepEqual(splitNationalPhone("04161234567"), {
    operatorCode: "0416",
    localNumber: "1234567",
  });
});

test("no transforma formatos internacionales con +58", () => {
  const current = { operatorCode: "0412", localNumber: "7654321" };
  assert.deepEqual(applyPhoneNumberInput("+584141234567", current), current);
});

test("la separación se recupera desde el teléfono canónico al volver al paso", () => {
  const phone = composeNationalPhone({ operatorCode: "0426", localNumber: "0001234" });
  assert.equal(phone, "04260001234");
  assert.deepEqual(splitNationalPhone(phone), {
    operatorCode: "0426",
    localNumber: "0001234",
  });
});
