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

test("el acceso usa el nuevo fondo, isotipo y ayuda solo por icono", async () => {
  const accessView = await readFile(
    new URL("../../src/features/entry/components/AccessView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(accessView, /login-background\.webp/);
  assert.match(accessView, /isopulsa\.png/);
  assert.match(accessView, /width: "clamp\(142px, 37vw, 164px\)"/);
  assert.match(accessView, /@media \(min-width: 414px\)/);
  assert.match(accessView, /pb: "max\(8px, env\(safe-area-inset-bottom\)\)"/);
  assert.match(accessView, /HelpOutlineRounded/);
  assert.match(accessView, /aria-label="Ayuda"/);
  assert.match(accessView, />\s*Iniciar sesión\s*</);
  assert.match(accessView, /themeTokens\.color\.brandLogo/);
  assert.doesNotMatch(accessView, />\s*Ayuda\s*</);
});

test("el formulario de ingreso móvil ocupa toda la vista y usa la ilustración de seguridad", async () => {
  const [signInSheet, signInVisual] = await Promise.all([
    readFile(new URL("../../src/features/auth/components/SignInSheet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/auth/components/SignInVisual.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(signInSheet, /xs: "100dvh"/);
  assert.match(signInSheet, /overflowX: "hidden"/);
  assert.doesNotMatch(signInSheet, /Ingresa tus datos para continuar\./);
  assert.match(signInSheet, /Activa tu biometría desde tu Perfil para acceder más rápido\./);
  assert.match(signInSheet, /direction=\{props\.in \? "left" : "right"\}/);
  assert.match(signInSheet, /transitionDuration=\{prefersReducedMotion \? 0 : \{ enter: 220, exit: 180 \}\}/);
  assert.match(signInVisual, /LoginIlustration\.webp/);
  assert.match(signInVisual, /@media \(max-width: 413px\)/);
  assert.doesNotMatch(signInSheet, /justifyContent: \{ xs: "space-between", sm: "flex-start" \}/);
});
