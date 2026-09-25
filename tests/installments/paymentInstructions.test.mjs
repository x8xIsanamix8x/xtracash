import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const {
  createCopyAllText,
  createInstructionRows,
  formatAccount,
  formatAccountType,
  formatPhone,
  getAvailableMethods,
  toCopyAmount,
  toLocalPhone,
} = await import("../../src/features/installments/paymentInstructions.ts");
const { parsePaymentSelectionQuery } = await import(
  "../../src/features/installments/paymentOptions.ts"
);

/** Datos bancarios reales de sandbox (datos-pago, 24/09/2026). */
const destination = {
  bank: "Banco Activo",
  bankCode: "0171",
  taxId: "J500887043",
  phone: "584142642085",
  beneficiaryName: "IMPULSA VENTURE CAPITAL C.A.",
  account: "01710002506002627254",
  accountType: "CTE",
};

test("teléfono internacional de Core a formato local", () => {
  assert.equal(toLocalPhone("584142642085"), "04142642085");
  assert.equal(toLocalPhone("0414-264-2085"), "04142642085");
  assert.equal(toLocalPhone("12345"), null);
  assert.equal(formatPhone("584142642085"), "0414 264 2085");
  assert.equal(formatPhone("12345"), "12345");
});

test("cuenta, tipo de cuenta y monto", () => {
  assert.equal(formatAccount("01710002506002627254"), "0171 0002 5060 0262 7254");
  assert.equal(formatAccount("123"), "123");
  assert.equal(formatAccountType("CTE"), "Corriente");
  assert.equal(formatAccountType("aho"), "Ahorro");
  assert.equal(formatAccountType("OTRA"), "OTRA");
  assert.equal(toCopyAmount("34372.09"), "34372,09");
});

test("pago móvil: banco, RIF, teléfono y monto", () => {
  const rows = createInstructionRows(destination, "34372.09", "mobile");
  assert.deepEqual(rows.map((row) => [row.label, row.displayValue, row.copyValue]), [
    ["Banco", "Banco Activo (0171)", "0171"],
    ["RIF", "J500887043", "J500887043"],
    ["Teléfono", "0414 264 2085", "04142642085"],
    ["Monto", "Bs. 34.372,09", "34372,09"],
  ]);
  assert.equal(
    createCopyAllText(rows),
    "Banco: 0171\nRIF: J500887043\nTeléfono: 04142642085\nMonto: 34372,09",
  );
});

test("transferencia: titular, cuenta y tipo", () => {
  const rows = createInstructionRows(destination, "68744.18", "transfer");
  assert.deepEqual(rows.map((row) => [row.label, row.displayValue, row.copyValue]), [
    ["Banco", "Banco Activo (0171)", "0171"],
    ["Titular", "IMPULSA VENTURE CAPITAL C.A.", "IMPULSA VENTURE CAPITAL C.A."],
    ["RIF", "J500887043", "J500887043"],
    ["Número de cuenta", "0171 0002 5060 0262 7254", "01710002506002627254"],
    ["Tipo de cuenta", "Corriente", "Corriente"],
    ["Monto", "Bs. 68.744,18", "68744,18"],
  ]);
});

test("sin cuenta solo se ofrece pago móvil y se omiten los campos que no vienen", () => {
  const partial = { ...destination, account: null, beneficiaryName: null, accountType: null };
  assert.deepEqual(getAvailableMethods(partial), ["mobile"]);
  assert.deepEqual(getAvailableMethods(destination), ["mobile", "transfer"]);
  assert.deepEqual(
    createInstructionRows(partial, "10.00", "transfer").map((row) => row.label),
    ["Banco", "RIF", "Monto"],
  );
});

test("la opción viaja en la URL", () => {
  assert.deepEqual(parsePaymentSelectionQuery("PROXIMA", null), { option: "PROXIMA" });
  assert.deepEqual(parsePaymentSelectionQuery("TODAS", "3"), { option: "TODAS" });
  assert.deepEqual(parsePaymentSelectionQuery("CUOTAS", "3"), { option: "CUOTAS", installmentCount: 3 });
  assert.deepEqual(parsePaymentSelectionQuery("CUOTAS", "x"), { option: "CUOTAS" });
  assert.equal(parsePaymentSelectionQuery("OTRA", null), null);
  assert.equal(parsePaymentSelectionQuery(undefined, undefined), null);
});
