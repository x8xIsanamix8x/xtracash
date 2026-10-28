import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCoreMobilePaymentBalance,
  parseCoreMobilePaymentSummary,
} from "../../src/features/mobile-payment/server/coreMobilePaymentContextValidation.ts";

test("lee available.bs del contrato de balance y normaliza a centavos", () => {
  assert.deepEqual(parseCoreMobilePaymentBalance({
    available: { bs: "031450.1250", usd: "850.00" },
  }), { availableBs: "31450.13" });

  assert.equal(parseCoreMobilePaymentBalance({
    available: { bs: 31450, usd: "850.00" },
  }), null);
  assert.equal(parseCoreMobilePaymentBalance({
    available: { usd: "850.00" },
  }), null);
});

test("mapea los estados financieros Core al acceso de Pago Móvil", () => {
  assert.deepEqual(parseCoreMobilePaymentSummary({
    balance: {
      available: { bs: "100.00", usd: "2.00" },
      totalCredit: { bs: "200.00", usd: "4.00" },
      status: "AL_DIA",
    },
  }), { accessStatus: "active" });
  assert.deepEqual(parseCoreMobilePaymentSummary({
    balance: { status: "SUSPENDIDO" },
  }), { accessStatus: "suspended" });
  assert.deepEqual(parseCoreMobilePaymentSummary({
    balance: { status: "BLOQUEADO" },
  }), { accessStatus: "blocked" });
});

test("rechaza balances ausentes y estados Core desconocidos", () => {
  assert.equal(parseCoreMobilePaymentSummary({ status: "AL_DIA" }), null);
  assert.equal(parseCoreMobilePaymentSummary({
    balance: { status: "CON_MORA" },
  }), null);
  assert.equal(parseCoreMobilePaymentSummary({
    balance: { status: "al_dia" },
  }), null);
});
