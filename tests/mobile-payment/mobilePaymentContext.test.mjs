import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getMobilePaymentRestrictionMessage,
  isMobilePaymentAccessAllowed,
} from "../../src/features/mobile-payment/accessStatus.ts";
import {
  parseMobilePaymentContext,
  parseMobilePaymentRestriction,
} from "../../src/features/mobile-payment/contractValidation.ts";

const contextPayload = {
  availableBs: "31450.00",
  accessStatus: "active",
  banks: [{ code: "0102", name: "Banco de Venezuela" }],
  contacts: [{
    id: "01a053c5-8c3e-737c-a1b8-79a1a537288d",
    name: "María Pérez",
    bankCode: "0102",
    documentType: "V",
    documentNumber: "12345678",
    phone: "04121234567",
  }],
};

test("valida el saldo y estado del contexto de Pago Móvil", () => {
  assert.deepEqual(parseMobilePaymentContext(contextPayload), contextPayload);

  for (const accessStatus of ["suspended", "blocked"]) {
    assert.equal(
      parseMobilePaymentContext({ ...contextPayload, accessStatus })?.accessStatus,
      accessStatus,
    );
  }
});

test("rechaza importes y estados no documentados", () => {
  assert.equal(parseMobilePaymentContext({
    ...contextPayload,
    availableBs: "31.450,00",
  }), null);
  assert.equal(parseMobilePaymentContext({
    ...contextPayload,
    accessStatus: "unknown",
  }), null);
});

test("solo permite solicitar el pago con una cuenta activa", () => {
  assert.equal(isMobilePaymentAccessAllowed("active"), true);
  assert.equal(isMobilePaymentAccessAllowed("suspended"), false);
  assert.equal(isMobilePaymentAccessAllowed("blocked"), false);
  assert.equal(getMobilePaymentRestrictionMessage("active"), null);
  assert.match(
    getMobilePaymentRestrictionMessage("suspended") ?? "",
    /suspendida/,
  );
  assert.match(
    getMobilePaymentRestrictionMessage("blocked") ?? "",
    /bloqueada/,
  );
});

test("revalida el acceso antes de iniciar y confirmar una transferencia", async () => {
  const projectUrl = new URL("../../", import.meta.url);
  const [initiationRoute, confirmationRoute] = await Promise.all([
    readFile(new URL(
      "src/features/mobile-payment/server/initiateMobilePaymentRoute.ts",
      projectUrl,
    ), "utf8"),
    readFile(new URL(
      "src/features/mobile-payment/server/confirmMobilePaymentRoute.ts",
      projectUrl,
    ), "utf8"),
  ]);

  for (const [source, mutation] of [
    [initiationRoute, "initiateMobilePaymentWithCore"],
    [confirmationRoute, "confirmMobilePaymentWithCore"],
  ]) {
    const accessCheck = source.indexOf("await assertMobilePaymentAccessWithCore");
    const coreMutation = source.lastIndexOf(`${mutation}(`);

    assert.notEqual(accessCheck, -1);
    assert.notEqual(coreMutation, -1);
    assert.ok(accessCheck < coreMutation);
  }
});

test("conserva el estado individual cuando el servidor rechaza una solicitud", () => {
  assert.equal(parseMobilePaymentRestriction({
    error: "business_rule",
    accessStatus: "blocked",
  }), "blocked");
  assert.equal(parseMobilePaymentRestriction({
    error: "business_rule",
    accessStatus: "suspended",
  }), "suspended");
  assert.equal(parseMobilePaymentRestriction({
    error: "business_rule",
    accessStatus: "active",
  }), null);
});
