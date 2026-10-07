import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const {
  compareAmounts,
  firstErrorField,
  formatAmountInput,
  formatPayerDocument,
  normalizeDocumentInput,
  normalizePhoneInput,
  normalizeReferenceInput,
  parseAmountInput,
  toCreateReportRequest,
  validatePaymentDate,
  validateReportForm,
} = await import("../../src/features/installments/reportForm.ts");

const context = {
  sourceBanks: [{ code: "0105", name: "Mercantil" }, { code: "0134", name: "Banesco" }],
  today: "2026-09-24",
  minDate: "2026-09-22",
  expectedAmountBs: "34372.09",
};

const valid = {
  senderBank: "0105",
  bankReference: "000123456789",
  paymentDate: "2026-09-24",
  payerDocument: "V-12345678",
  senderPhone: "04141234567",
  amount: "34372,09",
  confirmed: true,
};

test("lee montos escritos a la venezolana o con punto decimal", () => {
  assert.equal(parseAmountInput("34372,09"), "34372.09");
  assert.equal(parseAmountInput("34.372,09"), "34372.09");
  assert.equal(parseAmountInput("34372.09"), "34372.09");
  assert.equal(parseAmountInput("34372.5"), "34372.50");
  assert.equal(parseAmountInput("34.372"), "34372.00");
  assert.equal(parseAmountInput("1.234.567,8"), "1234567.80");
  assert.equal(parseAmountInput("Bs. 100"), "100.00");
  assert.equal(parseAmountInput(" 0100 "), "100.00");
  for (const invalid of ["", "abc", "1,2,3", "12,345", "-5", "1e5", "12.3.4,5,6"]) {
    assert.equal(parseAmountInput(invalid), null, invalid);
  }
  assert.equal(formatAmountInput("34372.09"), "34372,09");
});

test("compara montos al céntimo", () => {
  assert.equal(compareAmounts("34372.09", "34372.09"), 0);
  assert.equal(compareAmounts("34372.08", "34372.09"), -1);
  assert.equal(compareAmounts("100000.00", "34372.09"), 1);
});

test("normaliza referencia y teléfono mientras se escriben", () => {
  assert.equal(normalizeReferenceInput("00-12 34ab5678901234567890123"), "00123456789012345678");
  assert.equal(normalizePhoneInput("0414-123.45.67 999"), "0414123456799");
  assert.equal(normalizePhoneInput("+58 (414) 123-4567"), "584141234567");
});

test("acepta teléfonos con 0 o 58 de hasta 13 dígitos y conserva el número completo en el reporte", () => {
  for (const senderPhone of [
    "04141234567", "041412345678", "0414123456789",
    "584141234567", "5841412345678", "5804141234567",
    "584121234567", "584161234567", "584221234567", "584241234567", "584261234567",
  ]) {
    const values = { ...valid, senderPhone };
    assert.equal(normalizePhoneInput(senderPhone), senderPhone);
    assert.deepEqual(validateReportForm(values, context), {}, senderPhone);
    assert.equal(toCreateReportRequest(values, { option: "PROXIMA" }).senderPhone, senderPhone);
  }

  for (const senderPhone of [
    "0414123456", "04141234567890", "04141234567ab", "0499123456789",
    "58414123456", "58414123456789", "574141234567", "584991234567", "58414123456a",
  ]) {
    assert.ok(validateReportForm({ ...valid, senderPhone }, context).senderPhone, senderPhone);
  }
});

test("un formulario completo y correcto no tiene errores", () => {
  assert.deepEqual(validateReportForm(valid, context), {});
  // Pagar de más está permitido: el excedente lo resuelve backoffice.
  assert.deepEqual(validateReportForm({ ...valid, amount: "40000" }, context), {});
});

test("marca cada campo inválido y el foco va al primero", () => {
  const errors = validateReportForm({
    senderBank: "9999",
    bankReference: "12",
    paymentDate: "2026-09-25",
    payerDocument: "X-12",
    senderPhone: "0299123",
    amount: "abc",
    confirmed: false,
  }, context);

  assert.deepEqual(Object.keys(errors).sort(), [
    "amount",
    "bankReference",
    "confirmed",
    "payerDocument",
    "paymentDate",
    "senderBank",
    "senderPhone",
  ]);
  assert.equal(firstErrorField(errors), "senderBank");
  assert.equal(firstErrorField({ amount: "x", senderPhone: "y" }), "senderPhone");
  assert.equal(firstErrorField({ senderPhone: "x", payerDocument: "y" }), "payerDocument");
  assert.equal(firstErrorField({}), null);
});

test("el monto no puede ser menor a lo que cuesta la opción", () => {
  const errors = validateReportForm({ ...valid, amount: "34372,08" }, context);
  assert.equal(errors.amount, "El monto no puede ser menor a Bs. 34.372,09.");
  assert.equal(validateReportForm({ ...valid, amount: "0" }, context).amount, "Ingresa el monto que transferiste.");
  // Mientras se recalcula no se compara contra un monto viejo.
  assert.deepEqual(validateReportForm({ ...valid, amount: "1" }, { ...context, expectedAmountBs: null }), {});
});

test("la fecha del pago va del día del consumo a hoy", () => {
  assert.equal(validatePaymentDate("2026-09-22", context), null);
  assert.equal(validatePaymentDate("2026-09-24", context), null);
  assert.equal(validatePaymentDate("2026-09-21", context), "La fecha no puede ser anterior al consumo.");
  assert.equal(validatePaymentDate("2026-09-25", context), "La fecha del pago no puede ser futura.");
  assert.equal(validatePaymentDate("", context), "Selecciona la fecha en que hiciste el pago.");
  assert.equal(validatePaymentDate("2026-02-30", context), "Selecciona la fecha en que hiciste el pago.");
});

test("arma el reporte para el BFF según la opción", () => {
  assert.deepEqual(toCreateReportRequest(valid, { option: "PROXIMA" }), {
    option: "PROXIMA",
    amountBs: "34372.09",
    senderBank: "0105",
    payerDocument: "V-12345678",
    senderPhone: "04141234567",
    paymentDate: "2026-09-24",
    bankReference: "000123456789",
  });

  const receipt = { fileName: "comprobante.png", contentBase64: "iVBORw0KGgo=" };
  const cuotas = toCreateReportRequest(
    { ...valid, amount: "68.744,18" },
    { option: "CUOTAS", installmentCount: 2 },
    receipt,
  );
  assert.equal(cuotas.installmentCount, 2);
  assert.equal(cuotas.amountBs, "68744.18");
  assert.deepEqual(cuotas.receipt, receipt);

  assert.equal("installmentCount" in toCreateReportRequest(valid, { option: "TODAS" }), false);
  assert.throws(() => toCreateReportRequest({ ...valid, amount: "x" }, { option: "PROXIMA" }));
});

test("documento: se normaliza mientras se escribe", () => {
  assert.equal(normalizeDocumentInput("v12345678"), "V-12345678");
  assert.equal(normalizeDocumentInput("V-12.345.678"), "V-12345678");
  assert.equal(normalizeDocumentInput("12345678"), "V-12345678");
  assert.equal(normalizeDocumentInput("e 84.123.456"), "E-84123456");
  assert.equal(normalizeDocumentInput("J5008870431234"), "J-500887043");
  assert.equal(normalizeDocumentInput("V"), "V");
  assert.equal(normalizeDocumentInput("V-"), "V");
  assert.equal(normalizeDocumentInput(""), "");
  // Una letra que Core no acepta queda para que la validación la marque.
  assert.equal(normalizeDocumentInput("x123"), "X-123");
});

test("documento: obligatorio y con formato de Core", () => {
  const errorFor = (payerDocument) => validateReportForm({ ...valid, payerDocument }, context).payerDocument;
  assert.equal(errorFor(""), "Ingresa el documento de identidad de quien hizo el pago.");
  assert.equal(errorFor("V"), "Ingresa un documento válido (p. ej. V-12345678).");
  assert.equal(errorFor("X-123"), "Ingresa un documento válido (p. ej. V-12345678).");
  assert.equal(errorFor("V-1234567890"), "Ingresa un documento válido (p. ej. V-12345678).");
  for (const document of ["V-1", "E-84123456", "P-123456789", "J-500887043", "G-200000001", "C-12345"]) {
    assert.equal(errorFor(document), undefined, document);
  }
});

test("documento: prellenado desde el perfil", () => {
  assert.equal(formatPayerDocument("V", "12345678"), "V-12345678");
  assert.equal(formatPayerDocument(" e ", " 84123456 "), "E-84123456");
  assert.equal(formatPayerDocument("CI", "12345678"), null);
  assert.equal(formatPayerDocument("V", "12.345.678"), null);
  assert.equal(formatPayerDocument("V", "1234567890"), null);
});
