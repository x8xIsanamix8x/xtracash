import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  frequentlyAskedQuestionGroups,
  frequentlyAskedQuestions,
} = await import("../../src/features/help/data/frequentlyAskedQuestions.ts");

test("agrupa todas las preguntas frecuentes suministradas", () => {
  assert.deepEqual(
    frequentlyAskedQuestionGroups.map(({ title }) => title),
    [
      "Sobre Impúlsate Móvil",
      "Solicitud y recepción del financiamiento",
      "Consulta y gestión del financiamiento",
      "Pagos, moneda y comisiones",
      "Acceso a la plataforma y soporte",
      "Documentación y experiencia digital",
    ],
  );

  assert.equal(frequentlyAskedQuestions.length, 13);
  assert.deepEqual(
    frequentlyAskedQuestions.map(({ question }) => question),
    [
      "¿Qué es Impúlsate Móvil?",
      "¿Quién respalda esta plataforma?",
      "¿Qué beneficio especial hay para el equipo de Banco Activo?",
      "¿Cuánto tarda el proceso de aprobación?",
      "¿Cómo se reciben los créditos de Impúlsate Móvil?",
      "¿Cómo puedo llevar el control de lo que debo?",
      "¿Cuál es el plazo máximo para pagar el financiamiento?",
      "¿Cómo puedo realizar el pago total o parcial de mi financiamiento?",
      "¿En qué moneda se calcula y se cancela la deuda?",
      "¿Quién asume las comisiones de la plataforma y de cuánto son?",
      "¿Dónde puedo acceder a la aplicación?",
      "En caso de fallas o dudas con la aplicación, ¿cómo solicito soporte?",
      "¿Necesito consignar documentos en físico?",
    ],
  );
});

test("conserva los datos de pago y los enlaces oficiales", () => {
  const paymentQuestion = frequentlyAskedQuestions.find(
    ({ question }) => question.startsWith("¿Cómo puedo realizar el pago"),
  );
  const accessQuestion = frequentlyAskedQuestions.find(
    ({ question }) => question === "¿Dónde puedo acceder a la aplicación?",
  );
  const supportQuestion = frequentlyAskedQuestions.find(
    ({ question }) => question.includes("¿cómo solicito soporte?"),
  );

  assert.deepEqual(paymentQuestion?.details, [
    { label: "Banco", value: "Banco Activo" },
    { label: "RIF", value: "J-50088704-3" },
    { label: "Número de teléfono", value: "0414-3701076" },
  ]);
  assert.match(paymentQuestion?.note ?? "", /reportarlo en la aplicación/);
  assert.equal(
    accessQuestion?.action?.href,
    "https://impulsate-app.sandbox.impulsa.vc/",
  );
  assert.equal(
    supportQuestion?.action?.href,
    "mailto:soporte@impulsatechs.com",
  );
});

test("usa grupos separados y conserva un único acordeón expandido", async () => {
  const [accessView, helpView] = await Promise.all([
    readFile(new URL("../../src/features/entry/components/AccessView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/features/help/components/HelpCenterView.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(accessView, /href="\/help"/);
  assert.doesNotMatch(accessView, /Contacta con soporte/);
  assert.match(helpView, /¿Cómo podemos ayudarte\?/);
  assert.match(helpView, /Preguntas frecuentes/);
  assert.match(helpView, /frequentlyAskedQuestionGroups\.map/);
  assert.match(helpView, /useState<string \| false>\(false\)/);
  assert.match(helpView, /setExpandedQuestion\(expanded \? questionId : false\)/);
  assert.match(helpView, /prefersReducedMotion \? 0 : 180/);
  assert.match(helpView, /gap: 3/);
  assert.match(helpView, /gap: 1\.5/);
  assert.match(helpView, /component="a"/);
});
