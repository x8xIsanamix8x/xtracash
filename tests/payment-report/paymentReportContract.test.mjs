import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePaymentReportBffError,
  parsePaymentReportBffConflict,
  parsePaymentReportResult,
} from "../../src/features/payment-report/contractValidation.ts";
import {
  getPaymentSupportErrorMessage,
  isSafePaymentSupportFilename,
  MAX_PAYMENT_SUPPORT_BYTES,
  validatePaymentSupportFileMetadata,
} from "../../src/features/payment-report/paymentSupport.ts";
import {
  getSubmissionFailureStep,
  pendingPaymentReportPresentation,
  runPendingPrimaryAction,
} from "../../src/features/payment-report/pendingPaymentReport.ts";
import {
  parseCorePaymentReportResponse,
} from "../../src/features/payment-report/server/corePaymentReportResponse.ts";
import {
  getPaymentReportFailureResponse,
} from "../../src/features/payment-report/server/paymentReportFailure.ts";
import {
  parseCorePaymentSupport,
  parsePaymentSupport,
  toCorePaymentSupport,
} from "../../src/features/payment-report/server/paymentSupportValidation.ts";

const validCorePayload = {
  id: "01a01802-76c6-75b2-96fe-1944dbb2cc1d",
  monto: {
    bs: "3353.7900",
    usd: "42.91",
  },
  bancoEmisor: "0105",
  telefonoEmisor: "04121234567",
  fechaPago: "2026-08-23",
  referenciaBancaria: "1234",
  estado: "PENDIENTE",
  reportadoEn: "2026-08-23T18:49:25.030Z",
};

const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdfBytes = Buffer.from("%PDF-1.7\n");

function supportPayload(filename, bytes) {
  return {
    fileName: filename,
    contentBase64: bytes.toString("base64"),
  };
}

function coreSupportPayload(filename, bytes) {
  return {
    nombreArchivo: filename,
    contenidoBase64: bytes.toString("base64"),
  };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(status, body, contentType = "text/plain") {
  return new Response(body, {
    status,
    headers: { "Content-Type": contentType },
  });
}

test("acepta 200 con payload válido", async () => {
  assert.deepEqual(
    await parseCorePaymentReportResponse(jsonResponse(200, {
      ...validCorePayload,
      monto: { ...validCorePayload.monto, bs: "3353.79" },
    })),
    {
      ok: true,
      value: { amountBs: "3353.79", responseIncludesSupport: false },
    },
  );
});

test("acepta 201 con payload válido y no lo transforma en 502", async () => {
  assert.deepEqual(
    await parseCorePaymentReportResponse(jsonResponse(201, validCorePayload)),
    {
      ok: true,
      value: { amountBs: "3353.79", responseIncludesSupport: false },
    },
  );
});

test("acepta soporte opcional en 201 sin exponer su Base64 en el resultado saneado", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    soporte: coreSupportPayload("comprobante.pdf", pdfBytes),
  }));

  assert.deepEqual(result, {
    ok: true,
    value: { amountBs: "3353.79", responseIncludesSupport: true },
  });
  assert.equal(JSON.stringify(result).includes(pdfBytes.toString("base64")), false);
});

test("acepta el 201 documentado con soporte y campos adicionales", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    almacenamientoInterno: { estado: "GUARDADO" },
    soporte: {
      ...coreSupportPayload("comprobante.pdf", pdfBytes),
      id: "01a01802-76c6-75b2-96fe-1944dbb2cc1e",
      tipoContenido: "application/pdf",
    },
  }));
  const metadataOnly = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    soporte: {
      id: "01a01802-76c6-75b2-96fe-1944dbb2cc1e",
      estado: "GUARDADO",
    },
  }));

  assert.deepEqual(result, {
    ok: true,
    value: { amountBs: "3353.79", responseIncludesSupport: true },
  });
  assert.deepEqual(metadataOnly, {
    ok: true,
    value: { amountBs: "3353.79", responseIncludesSupport: true },
  });
  assert.equal(JSON.stringify(result).includes("contenidoBase64"), false);
});

test("acepta soporte omitido o null sin inventar un adjunto en la respuesta", async () => {
  const omitted = await parseCorePaymentReportResponse(
    jsonResponse(201, validCorePayload),
  );
  const nullable = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    soporte: null,
  }));

  const expected = {
    ok: true,
    value: { amountBs: "3353.79", responseIncludesSupport: false },
  };
  assert.deepEqual(omitted, expected);
  assert.deepEqual(nullable, expected);
});

test("acepta JSON válido aunque Core use un Content-Type distinto", async () => {
  const result = await parseCorePaymentReportResponse(textResponse(
    201,
    JSON.stringify(validCorePayload),
    "text/plain; charset=utf-8",
  ));

  assert.deepEqual(result, {
    ok: true,
    value: { amountBs: "3353.79", responseIncludesSupport: false },
  });
});

test("rechaza un 201 vacío o con JSON inválido como error de protocolo", async () => {
  const empty = await parseCorePaymentReportResponse(
    textResponse(201, "", "application/json"),
  );
  const malformed = await parseCorePaymentReportResponse(
    textResponse(201, "{", "application/json"),
  );

  assert.deepEqual(empty, { ok: false, type: "protocol" });
  assert.deepEqual(malformed, { ok: false, type: "protocol" });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "protocol",
    status: null,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("rechaza soporte presente con una forma no estructurada", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    soporte: "guardado",
  }));

  assert.deepEqual(result, { ok: false, type: "protocol" });
});

test("rechaza 200 con payload inválido como error de protocolo", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(200, {
    ...validCorePayload,
    monto: { bs: 3353.79 },
  }));

  assert.deepEqual(result, { ok: false, type: "protocol" });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "protocol",
    status: null,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("rechaza 201 con payload inválido como error de protocolo", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(201, {
    ...validCorePayload,
    monto: { bs: "3353.79000" },
  }));

  assert.deepEqual(result, { ok: false, type: "protocol" });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "protocol",
    status: null,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("mantiene 202 como respuesta upstream inválida", async () => {
  const result = await parseCorePaymentReportResponse(
    jsonResponse(202, validCorePayload),
  );

  assert.deepEqual(result, { ok: false, type: "http", status: 202 });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 202,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("mantiene 204 como respuesta upstream inválida", async () => {
  const result = await parseCorePaymentReportResponse(
    new Response(null, { status: 204 }),
  );

  assert.deepEqual(result, { ok: false, type: "http", status: 204 });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 204,
    conflict: null,
  }), {
    status: 502,
    body: { error: "upstream_error" },
  });
});

test("clasifica REPORTE_PENDIENTE y expone solo el código seguro", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(409, {
    detail: "contenido interno",
    instance: "/api/impulsate-movil/reportes-pago",
    status: 409,
    title: "Conflict",
    codigo: "REPORTE_PENDIENTE",
  }));

  assert.deepEqual(result, {
    ok: false,
    type: "conflict",
    conflict: "payment_report_pending",
  });
  if (result.ok || result.type !== "conflict") {
    assert.fail("Se esperaba un conflicto de reporte pendiente");
  }
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 409,
    conflict: result.conflict,
  }), {
    status: 409,
    body: { error: "payment_report_pending" },
  });
});

test("conserva un 409 no documentado como conflicto genérico", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(409, {
    status: 409,
    codigo: "OTRO_CONFLICTO",
  }));

  assert.deepEqual(result, {
    ok: false,
    type: "conflict",
    conflict: "payment_report_conflict",
  });
  if (result.ok || result.type !== "conflict") {
    assert.fail("Se esperaba un conflicto genérico");
  }
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 409,
    conflict: result.conflict,
  }), {
    status: 409,
    body: { error: "payment_report_conflict" },
  });
});

test("clasifica SIN_DEUDA sin exponer el Problem Detail", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(400, {
    detail: "contenido interno",
    status: 400,
    codigo: "SIN_DEUDA",
  }));

  assert.deepEqual(result, {
    ok: false,
    type: "bad_request",
    reason: "payment_report_no_debt",
  });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 400,
    conflict: null,
    badRequest: "payment_report_no_debt",
  }), {
    status: 400,
    body: { error: "payment_report_no_debt" },
  });
});

test("mantiene otros 400 como solicitud inválida segura", async () => {
  const result = await parseCorePaymentReportResponse(jsonResponse(400, {
    detail: "soporte rechazado internamente",
    codigo: "OTRO_CODIGO",
  }));

  assert.deepEqual(result, {
    ok: false,
    type: "bad_request",
    reason: "payment_report_invalid",
  });
  assert.deepEqual(getPaymentReportFailureResponse({
    type: "http",
    status: 400,
    conflict: null,
    badRequest: "payment_report_invalid",
  }), {
    status: 400,
    body: { error: "invalid_request" },
  });
});

test("el cliente distingue el reporte pendiente del conflicto genérico", () => {
  assert.equal(
    parsePaymentReportBffConflict({ error: "payment_report_pending" }),
    "payment_report_pending",
  );
  assert.equal(
    parsePaymentReportBffConflict({ error: "payment_report_conflict" }),
    "payment_report_conflict",
  );
  assert.equal(parsePaymentReportBffConflict({ error: "detail-interno" }), null);
});

test("el DTO del navegador requiere únicamente monto y booleano saneados", () => {
  assert.deepEqual(parsePaymentReportResult({
    amountBs: "3353.79",
    supportAttached: true,
    contenidoBase64: "no-debe-salir",
  }), {
    amountBs: "3353.79",
    supportAttached: true,
  });
  assert.equal(parsePaymentReportResult({ amountBs: "3353.79" }), null);

  assert.equal(
    parsePaymentReportBffError({ error: "invalid_payment_support" }),
    "invalid_payment_support",
  );
  assert.equal(
    parsePaymentReportBffError({ error: "payment_support_too_large" }),
    "payment_support_too_large",
  );
  assert.equal(
    parsePaymentReportBffError({ error: "payment_report_no_debt" }),
    "payment_report_no_debt",
  );
  assert.equal(parsePaymentReportBffError({ detail: "interno" }), null);
});

test("valida metadatos cliente para JPG, JPEG, PNG y PDF", () => {
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.jpg",
    size: 1024,
    type: "image/jpeg",
  }), null);
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.jpeg",
    size: 1024,
    type: "image/jpeg",
  }), null);
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.png",
    size: 1024,
    type: "image/png",
  }), null);
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.pdf",
    size: 1024,
    type: "application/pdf",
  }), null);
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.pdf",
    size: 1024,
    type: "",
  }), null);
});

test("rechaza archivo vacío, exceso de tamaño, extensión y MIME falsos", () => {
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.pdf",
    size: 0,
    type: "application/pdf",
  }), "unreadable");
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.pdf",
    size: MAX_PAYMENT_SUPPORT_BYTES + 1,
    type: "application/pdf",
  }), "too_large");
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.svg",
    size: 10,
    type: "image/svg+xml",
  }), "invalid_type");
  assert.equal(validatePaymentSupportFileMetadata({
    name: "comprobante.pdf",
    size: 10,
    type: "image/png",
  }), "invalid_type");
  assert.equal(
    getPaymentSupportErrorMessage("too_large"),
    "El archivo no puede superar los 5 MB.",
  );
});

test("valida firmas JPEG, PNG y PDF y acepta exactamente 5 MiB", () => {
  assert.equal(parsePaymentSupport(supportPayload("comprobante.jpg", jpegBytes)).ok, true);
  assert.equal(parsePaymentSupport(supportPayload("comprobante.jpeg", jpegBytes)).ok, true);
  assert.equal(parsePaymentSupport(supportPayload("comprobante.png", pngBytes)).ok, true);
  assert.equal(parsePaymentSupport(supportPayload("comprobante.pdf", pdfBytes)).ok, true);

  const limitBytes = Buffer.alloc(MAX_PAYMENT_SUPPORT_BYTES);
  jpegBytes.copy(limitBytes, 0);
  assert.equal(
    parsePaymentSupport(supportPayload("limite.jpg", limitBytes)).ok,
    true,
  );
});

test("separa el DTO del navegador del contrato de soporte de Core", () => {
  const browserSupport = supportPayload("comprobante.pdf", pdfBytes);
  assert.deepEqual(parsePaymentSupport(browserSupport), {
    ok: true,
    value: browserSupport,
  });
  assert.deepEqual(toCorePaymentSupport(browserSupport), {
    nombreArchivo: "comprobante.pdf",
    contenidoBase64: pdfBytes.toString("base64"),
  });
  assert.deepEqual(
    parseCorePaymentSupport(coreSupportPayload("comprobante.pdf", pdfBytes)),
    { ok: true, value: browserSupport },
  );
  assert.deepEqual(
    parsePaymentSupport(coreSupportPayload("comprobante.pdf", pdfBytes)),
    { ok: false, error: "invalid" },
  );
});

test("rechaza Base64 inválido, Data URL, firma incorrecta y más de 5 MiB", () => {
  assert.deepEqual(parsePaymentSupport({
    fileName: "comprobante.pdf",
    contentBase64: "%%%",
  }), { ok: false, error: "invalid" });
  assert.deepEqual(parsePaymentSupport({
    fileName: "comprobante.pdf",
    contentBase64: "data:application/pdf;base64,JVBERi0=",
  }), { ok: false, error: "invalid" });
  assert.deepEqual(parsePaymentSupport({
    fileName: "comprobante.pdf",
    contentBase64: "",
  }), { ok: false, error: "invalid" });
  assert.deepEqual(parsePaymentSupport({
    fileName: "comprobante.pdf",
    contentBase64: `${pdfBytes.toString("base64")}\n`,
  }), { ok: false, error: "invalid" });
  assert.deepEqual(
    parsePaymentSupport(supportPayload("comprobante.pdf", pngBytes)),
    { ok: false, error: "invalid" },
  );

  const oversizedBytes = Buffer.alloc(MAX_PAYMENT_SUPPORT_BYTES + 1);
  jpegBytes.copy(oversizedBytes, 0);
  assert.deepEqual(
    parsePaymentSupport(supportPayload("grande.jpg", oversizedBytes)),
    { ok: false, error: "too_large" },
  );
});

test("rechaza rutas, controles, campos extra y doble extensión peligrosa", () => {
  assert.equal(isSafePaymentSupportFilename("comprobante.final.pdf"), true);
  assert.equal(isSafePaymentSupportFilename("../comprobante.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("carpeta\\comprobante.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante\n.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante.exe.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante.exe.final.pdf"), false);
  assert.equal(isSafePaymentSupportFilename("comprobante.pdf".padStart(256, "a")), false);

  assert.deepEqual(parsePaymentSupport({
    ...supportPayload("comprobante.pdf", pdfBytes),
    mime: "application/pdf",
  }), { ok: false, error: "invalid" });
});

test("Pago en revisión es informativo, no reintentable y vuelve al inicio", () => {
  assert.equal(getSubmissionFailureStep("pending"), "pending");
  assert.notEqual(getSubmissionFailureStep("pending"), "form");
  assert.notEqual(getSubmissionFailureStep("pending"), "submitting");
  assert.deepEqual(pendingPaymentReportPresentation, {
    title: "Pago en revisión",
    message: "Ya tienes un pago en revisión. Espera a que el equipo de Impulsa lo valide antes de reportar otro.",
    primaryAction: "back_home",
    primaryActionLabel: "Volver al inicio",
    allowsRetry: false,
  });

  let backHomeCalls = 0;
  runPendingPrimaryAction(() => {
    backHomeCalls += 1;
  });
  assert.equal(backHomeCalls, 1);
});
