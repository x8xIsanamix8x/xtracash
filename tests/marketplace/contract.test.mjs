import test from "node:test";
import assert from "node:assert/strict";
import { isC2pChargeRequest, isC2pOtpRequest, isCreatePurchaseRequest, isInitialPaymentRequest } from "../../src/features/marketplace/contractValidation.ts";

const uuid = "01919b3e-7c2a-7d10-9f3e-2b6c8a4d5e71";
const mobile = { bancoOrigen: "0171", telefonoOrigen: "04141122556" };

test("validates the purchase amount and UUID without coercing strings", () => {
  assert.equal(isCreatePurchaseRequest({ productoId: uuid, pagoInicialUsdt: 350 }), true);
  assert.equal(isCreatePurchaseRequest({ productoId: uuid, pagoInicialUsdt: "350" }), false);
  assert.equal(isCreatePurchaseRequest({ productoId: "not-a-uuid", pagoInicialUsdt: 350 }), false);
});

test("validates the initial payment against Core fields", () => {
  const request = { metodo: "PAGO_MOVIL", ...mobile, referencia: "123456", fechaPago: "2026-10-19", montoBs: 17590.76 };
  assert.equal(isInitialPaymentRequest(request), true);
  assert.equal(isInitialPaymentRequest({ ...request, montoBs: 16000.25 }), true);
  assert.equal(isInitialPaymentRequest({ ...request, telefonoOrigen: "0422" }), false);
  assert.equal(isInitialPaymentRequest({ ...request, metodo: "C2P" }), false);
  assert.equal(isInitialPaymentRequest({ ...request, documentoPagador: "not-an-id" }), false);
});

test("C2P separates OTP request from explicit charge confirmation", () => {
  assert.equal(isC2pOtpRequest(mobile), true);
  assert.equal(isC2pChargeRequest({ ...mobile, otp: "605410" }), true);
  assert.equal(isC2pChargeRequest(mobile), false);
  assert.equal(isC2pChargeRequest({ ...mobile, otp: "12" }), false);
});
