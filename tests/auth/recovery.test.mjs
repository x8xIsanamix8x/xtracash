import assert from "node:assert/strict";
import test from "node:test";

import { maskRecoveryEmail } from "../../src/features/auth/recovery/presentation.ts";
import { isRetryableRecoveryConnectionError } from "../../src/features/auth/recovery/network.ts";
import {
  createCoreRecoveryEndpoint,
  isSuccessfulRecoveryStatus,
  normalizeRecoveryIdentifier,
  parseCoreRecoveryResponse,
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

test("solo permite reintentar errores anteriores a establecer conexión", () => {
  assert.equal(isRetryableRecoveryConnectionError({
    cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
  }), true);
  assert.equal(isRetryableRecoveryConnectionError({
    cause: { code: "ETIMEDOUT", syscall: "connect" },
  }), true);
  assert.equal(isRetryableRecoveryConnectionError({
    cause: { code: "ETIMEDOUT", syscall: "read" },
  }), false);
  assert.equal(isRetryableRecoveryConnectionError({
    cause: { code: "ECONNRESET" },
  }), false);
  assert.equal(isRetryableRecoveryConnectionError(new Error("fetch failed")), false);
});

test("enmascara el correo mostrado desde Perfil", () => {
  assert.equal(maskRecoveryEmail("leonardo@impulsa.vc"), "l••••••o@impulsa.vc");
  assert.equal(maskRecoveryEmail("a@impulsa.vc"), "a••@impulsa.vc");
  assert.equal(maskRecoveryEmail("invalido"), "••••••");
});
