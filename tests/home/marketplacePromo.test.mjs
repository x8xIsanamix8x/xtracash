import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canAccessMarketplace,
  MARKETPLACE_ALLOWED_EMAILS,
} from "../../src/features/home/marketplaceAccess.ts";

const projectUrl = new URL("../../", import.meta.url);

test("el allowlist del promocional contiene al usuario de prueba y falla cerrado", () => {
  assert.deepEqual(MARKETPLACE_ALLOWED_EMAILS, ["lmelo@impulsatechs.com"]);
  assert.equal(canAccessMarketplace(" LMELO@ImpulsaTechs.com "), true);
  assert.equal(canAccessMarketplace("otro@impulsatechs.com"), false);
  assert.equal(canAccessMarketplace(null), false);
});

test("el promocional del Home navega a la pantalla independiente Impulsa Place", async () => {
  const [home, dashboard, promo, marketplace] = await Promise.all([
    readFile(new URL("src/features/home/HomeView.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/home/components/NewBusinessHomeDashboard.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/home/components/MarketplacePromo.tsx", projectUrl), "utf8"),
    readFile(new URL("src/features/marketplace/MarketplaceView.tsx", projectUrl), "utf8"),
  ]);

  assert.match(home, /getProfilePersonalInfo\(controller\.signal\)/);
  assert.match(home, /canAccessMarketplace\(email\)/);
  assert.match(dashboard, /showMarketplacePromo && <MarketplacePromo \/>/);
  assert.match(promo, /Impulsa Place/);
  assert.match(promo, /href="\/marketplace"/);
  assert.match(marketplace, /canAccessMarketplace\(email\)/);
  assert.match(marketplace, /router\.replace\("\/home"\)/);
  assert.match(marketplace, /Estamos preparando Impulsa Place/);
});
