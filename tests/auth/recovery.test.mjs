import assert from "node:assert/strict";
import test from "node:test";

import {
  maskRecoveryEmail,
  PROFILE_RECOVERY_SUCCESS_MESSAGE,
  PUBLIC_RECOVERY_SUCCESS_MESSAGE,
} from "../../src/features/auth/recovery/presentation.ts";
import {
  createCoreRecoveryEndpoint,
  isSuccessfulRecoveryStatus,
  normalizeRecoveryIdentifier,
  parseRecoveryApiRequest,
  parseCoreRecoveryResponse,
  parseRecoveryRequest,
  RECOVERY_IDENTIFIER_MAX_LENGTH,
  validateRecoveryIdentifier,
} from "../../src/features/auth/recovery/validation.ts";

test("normaliza solo los espacios exteriores y conserva las mayúsculas", () => {
  assert.equal(normalizeRecoveryIdentifier(" Usuario@Ejemplo.com "), "Usuario@Ejemplo.com");
  assert.equal(validateRecoveryIdentifier("usuario@ejemplo.com"), "");
  assert.equal(validateRecoveryIdentifier("nombre.apellido+alias@sub.ejemplo.com"), "");
  assert.equal(
    validateRecoveryIdentifier("correo-invalido"),
    "Ingresa un correo electrónico válido.",
  );
});

test("sanea la solicitud que recibe el BFF", () => {
  assert.deepEqual(parseRecoveryRequest({ identifier: " Usuario@Ejemplo.com " }), {
    identifier: "Usuario@Ejemplo.com",
  });
  assert.equal(parseRecoveryRequest({ identifier: "correo-invalido" }), null);
  assert.equal(parseRecoveryRequest({}), null);
});

test("rechaza correos vacíos, espacios internos, controles y exceso de longitud", () => {
  assert.equal(validateRecoveryIdentifier("   "), "Ingresa tu correo electrónico.");
  assert.equal(
    validateRecoveryIdentifier("usuario @ejemplo.com"),
    "Ingresa un correo electrónico válido.",
  );
  assert.equal(
    validateRecoveryIdentifier("usuario@ejemplo.com\n"),
    "Ingresa un correo electrónico válido.",
  );
  assert.equal(
    validateRecoveryIdentifier("usuario\t@ejemplo.com"),
    "Ingresa un correo electrónico válido.",
  );

  const oversizedLocalPart = "a".repeat(RECOVERY_IDENTIFIER_MAX_LENGTH);
  assert.equal(
    validateRecoveryIdentifier(`${oversizedLocalPart}@ejemplo.com`),
    "Ingresa un correo electrónico válido.",
  );
});

test("distingue estrictamente las solicitudes pública y autenticada", () => {
  assert.deepEqual(parseRecoveryApiRequest({ identifier: " Usuario@Ejemplo.com " }), {
    kind: "public",
    request: { identifier: "Usuario@Ejemplo.com" },
  });
  assert.deepEqual(parseRecoveryApiRequest({ source: "profile" }), { kind: "profile" });
  assert.equal(
    parseRecoveryApiRequest({ source: "profile", identifier: "otro@ejemplo.com" }),
    null,
  );
  assert.equal(parseRecoveryApiRequest({ source: "otro" }), null);
});

test("construye exactamente el endpoint público de Core", () => {
  assert.equal(
    createCoreRecoveryEndpoint("https://core-api.sandbox.impulsa.vc"),
    "https://core-api.sandbox.impulsa.vc/api/recuperacion",
  );
  assert.equal(
    createCoreRecoveryEndpoint("https://core-api.sandbox.impulsa.vc/api/"),
    "https://core-api.sandbox.impulsa.vc/api/recuperacion",
  );
});

test("acepta los status documentado y observado sin relajar otros códigos", () => {
  assert.equal(isSuccessfulRecoveryStatus(200), true);
  assert.equal(isSuccessfulRecoveryStatus(202), true);
  assert.equal(isSuccessfulRecoveryStatus(201), false);
  assert.equal(isSuccessfulRecoveryStatus(204), false);
});

test("valida estrictamente la respuesta de Core", () => {
  assert.deepEqual(parseCoreRecoveryResponse({ message: "Solicitud recibida" }), {
    message: "Solicitud recibida",
  });
  assert.equal(parseCoreRecoveryResponse({ message: "" }), null);
  assert.equal(parseCoreRecoveryResponse({}), null);
  assert.equal(parseCoreRecoveryResponse(null), null);
});

test("enmascara el correo mostrado desde Perfil", () => {
  assert.equal(maskRecoveryEmail("leonardo@impulsa.vc"), "l••••••o@impulsa.vc");
  assert.equal(maskRecoveryEmail("a@impulsa.vc"), "a••@impulsa.vc");
  assert.equal(maskRecoveryEmail("invalido"), "••••••");
});

test("mantiene mensajes distintos y no enumerables para Login y Perfil", () => {
  assert.equal(
    PUBLIC_RECOVERY_SUCCESS_MESSAGE,
    "Si el correo se encuentra registrado, recibirás un enlace válido por 12 horas. Revisa tu bandeja de entrada o en la carpeta de correo no deseado.",
  );
  assert.equal(
    PROFILE_RECOVERY_SUCCESS_MESSAGE,
    "Enviamos un enlace para cambiar tu contraseña al correo asociado a tu cuenta. El enlace será válido durante 12 horas. Revisa tu bandeja de entrada y la carpeta de correo no deseado.",
  );
});
