import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  formatBank,
  formatBsAmount,
  formatDocument,
  formatPercentage,
  formatPhone,
  formatRateLabel,
} from "../../src/features/mobile-payment/format.ts";
import {
  getMobilePaymentNavigationDecision,
  hasMobilePaymentProgress,
} from "../../src/features/mobile-payment/navigation.ts";

const projectUrl = new URL("../../", import.meta.url);

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
  assert.equal(formatRateLabel("37.00", "BCV"), "Bs. 37,00 · BCV");
  assert.equal(
    formatRateLabel("853.49930000", "BANCO_ACTIVO"),
    "Bs. 853,50 · Banco Activo",
  );
  assert.equal(formatPercentage("0.0333"), "0,03%");
  assert.equal(formatPercentage("0.1000"), "0,10%");
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

  assert.equal(hasMobilePaymentProgress({
    amount: "",
    concept: "Medicinas",
    recipientMode: "choice",
    selectedContactId: null,
    selectedIcon: null,
    step: "details",
  }), true);

  assert.equal(hasMobilePaymentProgress({
    amount: "",
    concept: "",
    recipientMode: "choice",
    selectedContactId: null,
    selectedIcon: "stethoscope",
    step: "details",
  }), true);
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

test("mantiene estable el viewport de iOS y hace visible el procesamiento del pago", async () => {
  const [globalStyles, mobilePayment, reviewStep] = await Promise.all([
    readFile(new URL("src/app/globals.css", projectUrl), "utf8"),
    readFile(
      new URL("src/features/mobile-payment/MobilePaymentView.tsx", projectUrl),
      "utf8",
    ),
    readFile(
      new URL("src/features/mobile-payment/components/ReviewStep.tsx", projectUrl),
      "utf8",
    ),
  ]);

  assert.match(globalStyles, /@supports \(-webkit-touch-callout: none\)/);
  assert.match(globalStyles, /input,\s*textarea,\s*select \{\s*font-size: 1rem !important;/);
  assert.match(mobilePayment, /paymentContentRef\.current\?\.scrollIntoView/);

  const stickyActions = reviewStep.slice(reviewStep.indexOf('position: { xs: "sticky"'));
  assert.match(stickyActions, /role="status"/);
  assert.match(stickyActions, /Confirmando transferencia…/);
});
