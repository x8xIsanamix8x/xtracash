import assert from "node:assert/strict";
import test from "node:test";

import {
  getMarketplacePaymentMethods,
  isValidC2pOtp,
  isValidInitialPayment,
  parsePurchaseDestination,
} from "../../src/features/marketplace/paymentPresentation.ts";

const pagarA = {
  nombre: "Impulsa Venture Capital C.A.",
  documento: "J-00000000",
  telefono: "0424-000-0000",
  banco: "Banesco",
  cuenta: "01710000000000000000",
  tipoCuenta: "CORRIENTE",
};

test("parses purchase transfer details and always exposes all marketplace payment methods", () => {
  const destination = parsePurchaseDestination(pagarA);
  assert.equal(destination?.account, pagarA.cuenta);
  assert.deepEqual(getMarketplacePaymentMethods(), ["mobile", "transfer", "c2p"]);
  assert.deepEqual(getMarketplacePaymentMethods(), ["mobile", "transfer", "c2p"]);
});

test("validates report payload fields, destination, schedule and payment window", () => {
  const destination = parsePurchaseDestination(pagarA);
  const payment = {
    method: "transfer",
    bank: "0171",
    phone: "04241112233",
    documentId: "V-12345678",
    reference: "12345678",
    date: "2020-10-10",
    amountBs: "17590.76",
    destination,
    sourceBanks: [{ code: "0171", name: "Banesco" }],
    paymentEnabled: true,
  };
  assert.equal(isValidInitialPayment(payment), true);
  assert.equal(isValidInitialPayment({ ...payment, destination: parsePurchaseDestination({ ...pagarA, cuenta: "" }) }), false);
  assert.equal(isValidInitialPayment({ ...payment, date: "2020-02-30" }), false);
  assert.equal(isValidInitialPayment({ ...payment, reference: "12" }), false);
  assert.equal(isValidInitialPayment({ ...payment, paymentEnabled: false }), false);
});

test("accepts only numeric C2P OTPs from 4 to 8 digits", () => {
  assert.equal(isValidC2pOtp("1234"), true);
  assert.equal(isValidC2pOtp("12345678"), true);
  assert.equal(isValidC2pOtp("123"), false);
  assert.equal(isValidC2pOtp("123456789"), false);
  assert.equal(isValidC2pOtp("12a4"), false);
});
