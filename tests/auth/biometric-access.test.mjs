import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isBiometricAccessFeatureEnabled } from "../../src/features/biometric-access/config.ts";
import { biometricBffRequestPolicy } from "../../src/features/biometric-access/bffContract.ts";
import {
  getBiometricAccessIntegration,
  getBiometricAccessPreviewIntegration,
} from "../../src/features/biometric-access/integration.ts";
import {
  detectWebAuthnCapability,
  getBiometricActionFailureStatus,
  isSecureWebAuthnContext,
} from "../../src/features/biometric-access/client/detection.ts";

const projectUrl = new URL("../../", import.meta.url);

function createRuntime(overrides = {}) {
  return {
    hostname: "app.impulsa.vc",
    isSecureContext: true,
    protocol: "https:",
    publicKeyCredential: {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => true,
    },
    ...overrides,
  };
}

test("mantiene la biometría desactivada salvo habilitación explícita", () => {
  assert.equal(isBiometricAccessFeatureEnabled(undefined), false);
  assert.equal(isBiometricAccessFeatureEnabled("false"), false);
  assert.equal(isBiometricAccessFeatureEnabled("TRUE"), false);
  assert.equal(isBiometricAccessFeatureEnabled("true"), true);
});

test("prepara las futuras llamadas BFF sin caché y con credenciales same-origin", () => {
  assert.deepEqual(biometricBffRequestPolicy, {
    cache: "no-store",
    credentials: "same-origin",
  });
});

test("habilita solo la previsualización local y mantiene producción sin integración", () => {
  assert.equal(getBiometricAccessIntegration(), null);
  assert.notEqual(getBiometricAccessPreviewIntegration("development"), null);
  assert.equal(getBiometricAccessPreviewIntegration("production"), null);
  assert.equal(getBiometricAccessPreviewIntegration("test"), null);
});

test("admite WebAuthn únicamente bajo HTTPS seguro o localhost seguro", () => {
  assert.equal(isSecureWebAuthnContext(createRuntime()), true);
  assert.equal(isSecureWebAuthnContext(createRuntime({
    hostname: "localhost",
    protocol: "http:",
  })), true);
  assert.equal(isSecureWebAuthnContext(createRuntime({
    isSecureContext: false,
  })), false);
  assert.equal(isSecureWebAuthnContext(createRuntime({
    hostname: "app.impulsa.vc",
    protocol: "http:",
  })), false);
});

test("detecta un autenticador local compatible", async () => {
  assert.deepEqual(await detectWebAuthnCapability(createRuntime()), {
    hasPublicKeyCredential: true,
    isSecureExecutionContext: true,
    platformAuthenticatorAvailable: true,
    status: "supported",
  });
});

test("distingue navegador sin WebAuthn y autenticador local no disponible", async () => {
  assert.equal((await detectWebAuthnCapability(createRuntime({
    publicKeyCredential: null,
  }))).status, "unsupported");
  assert.equal((await detectWebAuthnCapability(createRuntime({
    publicKeyCredential: {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => false,
    },
  }))).status, "unavailable");
});

test("convierte un fallo de detección en error sin afirmar compatibilidad", async () => {
  const capability = await detectWebAuthnCapability(createRuntime({
    publicKeyCredential: {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => {
        throw new Error("detection-failure");
      },
    },
  }));

  assert.equal(capability.status, "error");
  assert.equal(capability.platformAuthenticatorAvailable, null);
});

test("trata la cancelación del dispositivo como estado no técnico", () => {
  assert.equal(
    getBiometricActionFailureStatus(new DOMException("cancelled", "NotAllowedError")),
    "cancelled",
  );
  assert.equal(
    getBiometricActionFailureStatus(new DOMException("aborted", "AbortError")),
    "cancelled",
  );
  assert.equal(getBiometricActionFailureStatus(new Error("failure")), "error");
});

test("integra la presentación en Login y Perfil sin alterar las credenciales tradicionales", async () => {
  const [login, loginAction, profile, security, profileSection, action, integration] = await Promise.all([
    readFile(new URL("src/features/auth/components/SignInSheet.tsx", projectUrl), "utf8"),
    readFile(new URL(
      "src/features/biometric-access/components/BiometricLoginAction.tsx",
      projectUrl,
    ), "utf8"),
    readFile(new URL("src/features/profile/ProfileView.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/profile/components/SecurityCard.tsx", projectUrl), "utf8"),
    readFile(new URL(
      "src/features/biometric-access/components/BiometricProfileSection.tsx",
      projectUrl,
    ), "utf8"),
    readFile(new URL(
      "src/features/biometric-access/components/BiometricActionControl.tsx",
      projectUrl,
    ), "utf8"),
    readFile(new URL("src/features/biometric-access/integration.ts", projectUrl), "utf8"),
  ]);

  assert.match(login, />\s*Ingresar\s*</);
  assert.match(login, /BiometricLoginAction/);
  assert.match(loginAction, /Identificación biométrica/);
  assert.match(loginAction, /presentation="login-icon"/);
  assert.match(profile, /onActivateBiometric/);
  assert.match(security, /Cambiar contraseña/);
  assert.match(security, /BiometricProfileSection/);
  assert.match(profileSection, /alignItems: "flex-end"/);
  assert.match(profileSection, /buttonVariant="contained"/);
  assert.match(profileSection, /76dvh/);
  assert.match(action, /ButtonBase/);
  assert.match(action, /Este dispositivo o navegador no permite el acceso biométrico/);
  assert.match(integration, /nodeEnv === "development"/);
  assert.doesNotMatch(action, /navigator\.credentials\.(?:create|get)/);

  const passwordPosition = login.indexOf('id="sign-in-password"');
  const biometricPosition = login.lastIndexOf("<BiometricLoginAction");
  const submitPosition = login.lastIndexOf("Ingresar\n");
  const recoveryPosition = login.lastIndexOf("¿Olvidaste tu contraseña?");

  assert.ok(passwordPosition < biometricPosition);
  assert.ok(biometricPosition < submitPosition);
  assert.ok(submitPosition < recoveryPosition);
});
