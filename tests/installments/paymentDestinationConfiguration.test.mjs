import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { getPaymentDestinationFromEnvironment } = await import(
  "../../src/features/installments/server/paymentDestinationConfiguration.ts"
);

const mobilePaymentEnvironment = {
  PAYMENT_DESTINATION_BANK_NAME: "Banco Activo",
  PAYMENT_DESTINATION_BANK_CODE: "0171",
  PAYMENT_DESTINATION_TAX_ID: "J500887043",
  PAYMENT_DESTINATION_PHONE: "+58 414-264-2085",
};

test("lee el destino de pago desde variables server-only", () => {
  assert.deepEqual(getPaymentDestinationFromEnvironment({
    ...mobilePaymentEnvironment,
    PAYMENT_DESTINATION_BENEFICIARY_NAME: "IMPULSA VENTURE CAPITAL C.A.",
    PAYMENT_DESTINATION_BANK_ACCOUNT: "0171 0002 5060 0262 7254",
    PAYMENT_DESTINATION_BANK_ACCOUNT_TYPE: "CTE",
  }), {
    bank: "Banco Activo",
    bankCode: "0171",
    taxId: "J500887043",
    phone: "584142642085",
    beneficiaryName: "IMPULSA VENTURE CAPITAL C.A.",
    account: "01710002506002627254",
    accountType: "CTE",
  });
});

test("permite configurar solo pago movil", () => {
  assert.deepEqual(getPaymentDestinationFromEnvironment(mobilePaymentEnvironment), {
    bank: "Banco Activo",
    bankCode: "0171",
    taxId: "J500887043",
    phone: "584142642085",
    beneficiaryName: null,
    account: null,
    accountType: null,
  });
});

test("rechaza configuracion incompleta o invalida", () => {
  assert.equal(getPaymentDestinationFromEnvironment({}), null);
  assert.equal(getPaymentDestinationFromEnvironment({
    ...mobilePaymentEnvironment,
    PAYMENT_DESTINATION_BANK_CODE: "171",
  }), null);
  assert.equal(getPaymentDestinationFromEnvironment({
    ...mobilePaymentEnvironment,
    PAYMENT_DESTINATION_BANK_ACCOUNT: "01710002506002627254",
  }), null);
});
