import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { frequentlyAskedQuestions } = await import("../../src/features/help/data/frequentlyAskedQuestions.ts");

test("incluye todas las preguntas frecuentes suministradas", () => {
  assert.equal(frequentlyAskedQuestions.length, 15);
  assert.deepEqual(
    frequentlyAskedQuestions.map(({ question }) => question),
    [
      "¿Qué es Impúlsate Móvil?",
      "¿Quién respalda esta plataforma?",
      "¿Qué beneficio especial hay para el equipo de Banco Activo?",
      "¿Cómo se reciben los créditos de Impúlsate Móvil?",
      "¿Cuánto tarda el proceso de aprobación?",
      "¿Cómo puedo llevar el control de lo que debo?",
      "¿Cómo puedo realizar el pago total o parcial de mi financiamiento?",
      "¿En qué moneda se calcula y se cancela la deuda?",
      "¿Quién asume las comisiones de la plataforma y de cuánto son?",
      "¿Cuál es el plazo máximo para pagar el financiamiento?",
      "¿Qué beneficios obtengo si pago antes del mes (Pronto Pago)?",
      "¿Dónde puedo descargar la aplicación?",
      "En caso de fallas o dudas con la app, ¿cómo solicito soporte?",
      "¿Es seguro utilizar Impúlsate Móvil?",
      "¿Necesito consignar documentos en físico?",
    ],
  );
});

test("usa una vista propia y conserva un único acordeón expandido", async () => {
  const [accessView, helpView] = await Promise.all([
    readFile(new URL("../../src/features/entry/components/AccessView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/help/components/HelpCenterView.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(accessView, /href="\/help"/);
  assert.doesNotMatch(accessView, /Contacta con soporte/);
  assert.match(helpView, /¿Cómo podemos ayudarte\?/);
  assert.match(helpView, /Preguntas frecuentes/);
  assert.match(helpView, /useState<string \| false>\(false\)/);
  assert.match(helpView, /setExpandedQuestion\(expanded \? item.question : false\)/);
  assert.match(helpView, /prefersReducedMotion \? 0 : 180/);
  assert.match(helpView, /m: "0 !important"/);
  assert.match(helpView, /transformOrigin: "top center"/);
});
