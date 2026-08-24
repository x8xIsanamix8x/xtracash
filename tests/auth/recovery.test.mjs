import assert from "node:assert/strict";
import test from "node:test";

import { maskRecoveryEmail } from "../../src/features/auth/recovery/presentation.ts";
import {
  normalizeRecoveryIdentifier,
  parseRecoveryRequest,
  validateRecoveryIdentifier,
} from "../../src/features/auth/recovery/validation.ts";

test("normaliza y valida el correo sin alterar el contrato de recuperación", () => {
  assert.equal(normalizeRecoveryIdentifier(" USUARIO@EJEMPLO.COM "), "usuario@ejemplo.com");
  assert.equal(validateRecoveryIdentifier("usuario@ejemplo.com"), "");
  assert.equal(
    validateRecoveryIdentifier("correo-invalido"),
    "Ingresa un correo electrónico válido.",
  );
});

test("sanea la solicitud que recibe el BFF", () => {
  assert.deepEqual(parseRecoveryRequest({ identifier: " Usuario@Ejemplo.com " }), {
    identifier: "usuario@ejemplo.com",
  });
  assert.equal(parseRecoveryRequest({ identifier: "correo-invalido" }), null);
  assert.equal(parseRecoveryRequest({}), null);
});

test("enmascara el correo mostrado desde Perfil", () => {
  assert.equal(maskRecoveryEmail("leonardo@impulsa.vc"), "l••••••o@impulsa.vc");
  assert.equal(maskRecoveryEmail("a@impulsa.vc"), "a••@impulsa.vc");
  assert.equal(maskRecoveryEmail("invalido"), "••••••");
});
