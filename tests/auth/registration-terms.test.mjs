import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { TERMS_AND_CONDITIONS } from "../../src/features/auth/registration/termsAndConditions.ts";

const APPROVED_TERMS_SHA256 = "182378e4b26a0dec3997df280fb812afa9bae2b540b2fafff0ef1f9d785517da";

test("conserva sin cambios el documento legal aprobado", () => {
  const termsHash = createHash("sha256").update(TERMS_AND_CONDITIONS, "utf8").digest("hex");

  assert.equal(Buffer.byteLength(TERMS_AND_CONDITIONS, "utf8"), 25_515);
  assert.equal(termsHash, APPROVED_TERMS_SHA256);
});

test("muestra la aceptación obligatoria y abre los términos desde su enlace", async () => {
  const [confirmationStep, termsContent] = await Promise.all([
    readFile(
      new URL(
        "../../src/features/auth/registration/components/ConfirmationStep.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/features/auth/registration/components/TermsAndConditionsContent.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(confirmationStep, /required/);
  assert.match(confirmationStep, /Acepto los\{" "\}/);
  assert.match(confirmationStep, />\s*términos y condiciones\s*</);
  assert.match(confirmationStep, /onClick=\{\(\) => setIsTermsOpen\(true\)\}/);
  assert.match(confirmationStep, /<TermsAndConditionsContent \/>/);
  assert.doesNotMatch(confirmationStep, /pendientes de publicación por Producto y Legal/);

  assert.match(termsContent, /TERMS_AND_CONDITIONS\.split\("\\r\\n"\)/);
  assert.match(termsContent, /whiteSpace: "pre-wrap"/);
  assert.match(termsContent, /line\.startsWith\("MÓDULO "\)/);
  assert.match(termsContent, /line\.startsWith\("ARTÍCULO "\)/);
  assert.match(termsContent, /line\.startsWith\("•"\)/);
  assert.match(termsContent, /line === "ACEPTACIÓN FINAL"/);
});
