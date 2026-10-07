import "../auth/support/server-loader.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { createInstallmentReportInCore, getPaymentDataFromCore } = await import(
  "../../src/features/installments/server/coreInstallments.ts"
);

const paymentDestinationKeys = [
  "PAYMENT_DESTINATION_BANK_NAME",
  "PAYMENT_DESTINATION_BANK_CODE",
  "PAYMENT_DESTINATION_TAX_ID",
  "PAYMENT_DESTINATION_PHONE",
  "PAYMENT_DESTINATION_BENEFICIARY_NAME",
  "PAYMENT_DESTINATION_BANK_ACCOUNT",
  "PAYMENT_DESTINATION_BANK_ACCOUNT_TYPE",
];

test("consulta datos-pago y usa su destino aunque no existan variables de pago", async () => {
  const paymentBody = JSON.parse(
    await readFile(new URL("./fixtures/datos-pago-hoy.json", import.meta.url), "utf8"),
  );
  const originalFetch = globalThis.fetch;
  const originalCoreApiUrl = process.env.CORE_API_URL;
  const originalPaymentEnvironment = Object.fromEntries(
    paymentDestinationKeys.map((key) => [key, process.env[key]]),
  );
  const calls = [];

  process.env.CORE_API_URL = "https://core.example.test";
  for (const key of paymentDestinationKeys) delete process.env[key];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/api/directorio-bancos")) {
      return Response.json([{ code: "0171", name: "Banco Activo" }]);
    }
    return Response.json(paymentBody);
  };

  try {
    const data = await getPaymentDataFromCore(
      "access-token",
      "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3",
      "2026-09-24",
      new AbortController().signal,
    );

    assert.deepEqual(data.destination, {
      bank: "Banco Activo",
      bankCode: "0171",
      taxId: "J500887043",
      phone: "584142642085",
      beneficiaryName: "IMPULSA VENTURE CAPITAL C.A.",
      account: "01710002506002627254",
      accountType: "CTE",
    });
    assert.equal(calls.length, 2);
    assert.ok(calls.some(({ url, init }) => (
      url === "https://core.example.test/api/impulsate-movil/datos-pago?consumptionId=01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3&paymentDate=2026-09-24"
      && init.headers.Authorization === "Bearer access-token"
    )));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCoreApiUrl === undefined) delete process.env.CORE_API_URL;
    else process.env.CORE_API_URL = originalCoreApiUrl;
    for (const [key, value] of Object.entries(originalPaymentEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("el reporte manda a Core el documento y teléfono completos de quien pagó", async () => {
  const originalFetch = globalThis.fetch;
  const originalCoreApiUrl = process.env.CORE_API_URL;
  const bodies = [];
  process.env.CORE_API_URL = "https://core.example.test";
  globalThis.fetch = async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return Response.json({
      id: "01a0d7be-27a2-7e3a-9927-2193fa628468",
      amount: { bs: "34372.09", usd: "40.23" },
      reportedAmount: "34372.09",
      paymentDate: "2026-09-24",
    }, { status: 201 });
  };

  const report = {
    option: "PROXIMA",
    amountBs: "34372.09",
    senderBank: "0105",
    senderPhone: "04141234567",
    paymentDate: "2026-09-24",
    bankReference: "000123456789",
  };
  try {
    const consumptionId = "01a0cb0e-8dcf-70d3-a1cf-bd74d4efaeb3";
    const signal = new AbortController().signal;
    await createInstallmentReportInCore("token", consumptionId, { ...report, payerDocument: "E-84123456" }, signal);
    await createInstallmentReportInCore("token", consumptionId, report, signal);
    await createInstallmentReportInCore("token", consumptionId, { ...report, senderPhone: "5841412345678" }, signal);
    await createInstallmentReportInCore("token", consumptionId, { ...report, senderPhone: "5804141234567" }, signal);

    assert.equal(bodies[0].payerDocument, "E-84123456");
    // Sin documento no se manda el campo: Core usa el del cliente.
    assert.equal("payerDocument" in bodies[1], false);
    assert.equal(bodies[2].senderPhone, "5841412345678");
    assert.equal(bodies[3].senderPhone, "5804141234567");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCoreApiUrl === undefined) delete process.env.CORE_API_URL;
    else process.env.CORE_API_URL = originalCoreApiUrl;
  }
});
