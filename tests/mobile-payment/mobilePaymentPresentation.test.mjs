import assert from "node:assert/strict";
import test from "node:test";

import {
  formatBank,
  formatBsAmount,
  formatDocument,
  formatPhone,
  formatRateLabel,
} from "../../src/features/mobile-payment/format.ts";
import {
  getMobilePaymentNavigationDecision,
  hasMobilePaymentProgress,
} from "../../src/features/mobile-payment/navigation.ts";

test("conserva el código y el nombre bancario completo", () => {
  assert.equal(
    formatBank({
      code: "0177",
      name: "Banco de la Fuerza Armada Nacional Bolivariana",
    }),
    "0177 · Banco de la Fuerza Armada Nacional Bolivariana",
  );
});

test("presenta importes, teléfono y documento sin alterar sus valores canónicos", () => {
  assert.equal(formatBsAmount("222.00"), "Bs. 222,00");
  assert.equal(formatPhone("04241678905"), "0424-1678905");
  assert.equal(formatDocument("V", "78974565"), "V-78.974.565");
});

test("mapea únicamente fuentes de tasa conocidas y no muestra enums técnicos", () => {
  assert.equal(
    formatRateLabel("36.50", "BANCO_ACTIVO"),
    "Bs. 36,50 · Banco Activo",
  );
  assert.equal(formatRateLabel("36.50", "FUENTE_NUEVA"), "Bs. 36,50");
});

test("protege la salida del pago cuando ya existen datos", () => {
  const hasEnteredData = hasMobilePaymentProgress({
    amount: "1.500,00",
    recipientMode: "manual",
    selectedContactId: null,
    step: "details",
  });

  assert.equal(hasEnteredData, true);
  assert.equal(getMobilePaymentNavigationDecision({
    destination: "movements",
    hasEnteredData,
    isTransactionPending: false,
    step: "details",
  }), "confirm");
});

test("bloquea la navegación transaccional y libera las pantallas de resultado", () => {
  assert.equal(getMobilePaymentNavigationDecision({
    destination: "profile",
    hasEnteredData: true,
    isTransactionPending: true,
    step: "review",
  }), "stay");
  assert.equal(getMobilePaymentNavigationDecision({
    destination: "home",
    hasEnteredData: true,
    isTransactionPending: false,
    step: "result",
  }), "allow");
  assert.equal(getMobilePaymentNavigationDecision({
    destination: "mobile-payment",
    hasEnteredData: false,
    isTransactionPending: false,
    step: "details",
  }), "stay");
});
