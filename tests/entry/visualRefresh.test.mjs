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

  assert.match(onboardingVisual, /width: "min\(100%, 450px\)"/);
  assert.match(onboardingVisual, /maxWidth: "100%"/);
});

test("el acceso usa el nuevo fondo, isotipo y ayuda solo por icono", async () => {
  const accessView = await readFile(
    new URL("../../src/features/entry/components/AccessView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(accessView, /login-background\.webp/);
  assert.match(accessView, /isopulsa\.png/);
  assert.match(accessView, /HelpOutlineRounded/);
  assert.match(accessView, /aria-label="Ayuda"/);
  assert.match(accessView, /themeTokens\.color\.brandLogo/);
  assert.doesNotMatch(accessView, />\s*Ayuda\s*</);
});
