import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { getMasterOnboardingMessage, MASTER_ONBOARDING_URL } = await import("../../src/features/master-onboarding/presentation.ts");
const { parseCoreAccountSummary, parseHomeAccountSummary } = await import("../../src/features/home/accountSummaryValidation.ts");
const projectUrl = new URL("../../", import.meta.url);

test("traduce las cuatro fases del onboarding a avance y mensajes accionables", () => {
  const initial = getMasterOnboardingMessage({ completedPhases: 0 });
  assert.equal(initial.percentage, 25);
  assert.match(initial.description, /registraste en Impúlsate Móvil/);
  assert.equal(initial.completed, false);

  assert.equal(getMasterOnboardingMessage({ completedPhases: 1 }).percentage, 25);
  assert.equal(getMasterOnboardingMessage({ completedPhases: 2 }).percentage, 50);
  assert.equal(getMasterOnboardingMessage({ completedPhases: 3 }).percentage, 75);

  const completed = getMasterOnboardingMessage({ completedPhases: 4 });
  assert.equal(completed.percentage, 100);
  assert.equal(completed.completed, true);
  assert.match(completed.description, /has completado tu información para Impúlsate/);
});

test("mantiene la redirección externa y la composición responsive solicitada", async () => {
  const [prompt, profileCard, home, profile] = await Promise.all([
    readFile(new URL("src/features/master-onboarding/components/MasterOnboardingPrompt.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/master-onboarding/components/MasterOnboardingProfileCard.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/home/HomeView.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/profile/ProfileView.tsx", projectUrl), "utf8"),
  ]);

  assert.equal(MASTER_ONBOARDING_URL, "https://onboarding.sandbox.impulsa.vc");
  assert.match(prompt, /target="_blank"/);
  assert.match(prompt, /rel="noopener noreferrer"/);
  assert.match(prompt, /maxHeight: \{ xs: "50dvh"/);
  assert.match(profileCard, /Continúa aumentando tu límite de crédito/);
  assert.match(home, /consumeMasterOnboardingPrompt/);
  assert.match(home, /completedPhases <= 3/);
  assert.match(home, /MasterOnboardingPrompt/);
  assert.match(profile, /MasterOnboardingProfileCard/);
  assert.match(profile, /"information" "onboarding" "security"/);
});

test("traduce el contrato Core y el DTO BFF de progreso sin mezclar sus campos", () => {
  const base = {
    name: "Ana", accountStatus: "ACTIVE", products: [], movements: [],
    payments: { hasPendingPayment: false, nextCutoffDate: null, currentDebt: null, minimumPayment: null, delinquencyStage: "AL_DIA" },
  };
  assert.deepEqual(parseCoreAccountSummary({ ...base, OnboardingMaster: { fasesCompletadas: 2 } })?.onboardingMaster, { completedPhases: 2 });
  assert.equal(parseCoreAccountSummary({ ...base, OnboardingMaster: { fasesCompletadas: 5 } }), null);
  assert.deepEqual(parseHomeAccountSummary({
    name: "Ana", accountStatus: "ACTIVE", product: null, movements: [],
    payments: { hasPendingPayment: false, nextCutoffDate: null, currentDebtBs: null, minimumPaymentBs: null, delinquencyStage: "AL_DIA" },
    onboardingMaster: { completedPhases: 4 },
  })?.onboardingMaster, { completedPhases: 4 });
});
