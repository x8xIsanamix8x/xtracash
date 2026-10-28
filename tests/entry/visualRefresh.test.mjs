import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { onboardingSteps } = await import("../../src/features/entry/data/onboardingSteps.ts");

test("asocia cada paso de onboarding con su ilustración aprobada", () => {
  assert.deepEqual(
    onboardingSteps.map(({ imageSrc }) => imageSrc),
    [
      "/entry/onboarding-empieza.webp",
      "/entry/onboarding-guiamos.webp",
      "/entry/onboarding-sabes.webp",
      "/entry/onboarding-seguridad.webp",
    ],
  );
});

test("las ilustraciones respetan el ancho del contenedor para evitar scroll lateral", async () => {
  const onboardingVisual = await readFile(
    new URL("../../src/features/entry/components/OnboardingVisual.tsx", import.meta.url),
    "utf8",
  );

  assert.match(onboardingVisual, /width: "min\(100%, 562px\)"/);
  assert.match(onboardingVisual, /maxWidth: "100%"/);
  assert.match(onboardingVisual, /height: "min\(100%, clamp\(240px, 48dvh, 500px\)\)"/);
  assert.match(onboardingVisual, /maxHeight: "100%"/);
});

test("el acceso usa el fondo e isotipo del Figma y ayuda solo por icono", async () => {
  const accessView = await readFile(
    new URL("../../src/features/entry/components/AccessView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(accessView, /login-waves-background\.webp/);
  assert.match(accessView, /isotipo-impulsa\.png/);
  assert.match(accessView, /pb: "calc\(21px \+ env\(safe-area-inset-bottom\)\)"/);
  assert.match(accessView, /borderRadius: "999px"/);
  assert.match(accessView, /themeTokens\.color\.preLoginPrimary/);
  assert.match(accessView, /themeTokens\.color\.preLoginNavy/);
  assert.match(accessView, /HelpOutlineRounded/);
  assert.match(accessView, /aria-label="Ayuda"/);
  assert.match(accessView, />\s*Iniciar sesión\s*</);
  assert.match(accessView, />\s*Registrarme\s*</);
  assert.match(accessView, />\s*IMPÚLSATE MÓVIL\s*</);
  assert.doesNotMatch(accessView, />\s*Ayuda\s*</);
});

test("el formulario de ingreso móvil ocupa toda la vista con el diseño del Figma", async () => {
  const signInSheet = await readFile(
    new URL("../../src/features/auth/components/SignInSheet.tsx", import.meta.url),
    "utf8",
  );

  assert.match(signInSheet, /xs: "100dvh"/);
  assert.match(signInSheet, /overflowX: "hidden"/);
  assert.doesNotMatch(signInSheet, /Ingresa tus datos para continuar\./);
  assert.match(signInSheet, /\{showBiometricAccess && \(\s*<Box/);
  assert.doesNotMatch(signInSheet, /face-scan\.svg/);
  assert.match(signInSheet, /direction=\{props\.in \? "left" : "right"\}/);
  assert.match(signInSheet, /transitionDuration=\{prefersReducedMotion \? 0 : \{ enter: 220, exit: 180 \}\}/);
  assert.match(signInSheet, /login-impulsa-mascot\.webp/);
  assert.doesNotMatch(signInSheet, /src="\/entry\/isotipo-impulsa\.png"/);
  assert.match(signInSheet, /themeTokens\.color\.preLoginBackground/);
  assert.match(signInSheet, /borderRadius: "999px"/);
  assert.doesNotMatch(signInSheet, /LoginIlustration|SignInVisual/);
  assert.doesNotMatch(signInSheet, /justifyContent: \{ xs: "space-between", sm: "flex-start" \}/);
});

test("las pantallas de entrada ocupan el viewport dinamico completo", async () => {
  const files = [
    "../../src/features/entry/EntryFlow.tsx",
    "../../src/features/entry/components/AccessView.tsx",
    "../../src/features/entry/components/OnboardingView.tsx",
  ];

  for (const pathname of files) {
    const source = await readFile(new URL(pathname, import.meta.url), "utf8");
    assert.match(source, /height: "100dvh"/);
    assert.match(source, /minHeight: "100dvh"/);
  }
});

test("los fondos publicos cubren tambien el canvas raiz de iOS", async () => {
  const [canvas, access, signIn, registration, recovery] = await Promise.all([
    readFile(new URL("../../src/components/ViewportCanvasBackground.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/entry/components/AccessView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/auth/components/SignInSheet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/auth/registration/RegistrationView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/auth/recovery/RecoveryView.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(canvas, /html: \{ backgroundColor: color \}/);
  assert.match(canvas, /body: \{ backgroundColor: color \}/);
  assert.match(access, /ViewportCanvasBackground color="#FFFFFF"/);
  for (const source of [signIn, registration, recovery]) {
    assert.match(source, /ViewportCanvasBackground color=\{themeTokens\.color\.preLoginBackground\}/);
  }
});
