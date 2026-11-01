import assert from "node:assert/strict";
import test from "node:test";
import { getInitialPlanReason, parseMarketplaceInitialOptions, sameInitialPercentage } from "../../src/features/marketplace/planOptions.ts";

const option = (porcentaje) => ({
  porcentaje,
  inicial: { usdt: "300.00", bs: "70127.82" },
  pagoInicial: { usdt: "335.00", bs: "78356.60" },
  aFinanciar: { usdt: "700.00", bs: "163631.58" },
  cuotas: 6,
  montoCuota: { usdt: "116.66", bs: "27271.93" },
});

test("parses backend initial options without calculating or changing monetary values", () => {
  const options = parseMarketplaceInitialOptions([option("30"), option("40")]);
  assert.deepEqual(options?.map(({ porcentaje }) => porcentaje), ["30", "40"]);
  assert.equal(options?.[0].pagoInicial.usdt, "335.00");
});

test("rejects incomplete, invalid, or duplicated backend initial options", () => {
  assert.equal(parseMarketplaceInitialOptions(null), null);
  assert.equal(parseMarketplaceInitialOptions([option("30"), { ...option("40"), pagoInicial: undefined }]), null);
  assert.equal(parseMarketplaceInitialOptions([option("30"), option("30.0")]), null);
  assert.equal(parseMarketplaceInitialOptions([option("101")]), null);
});

test("matches equivalent percentage formats and explains backend validation reasons", () => {
  assert.equal(sameInitialPercentage("30.00", "30"), true);
  assert.equal(sameInitialPercentage("30", "40"), false);
  assert.equal(getInitialPlanReason("CUPO_INSUFICIENTE"), "El disponible vigente no cubre el monto a financiar con esta inicial.");
  assert.equal(getInitialPlanReason("UNKNOWN"), null);
});
