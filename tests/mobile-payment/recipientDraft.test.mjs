import assert from "node:assert/strict";
import test from "node:test";

import { recipientDataFromContact } from "../../src/features/mobile-payment/recipientDraft.ts";

test("un beneficiario guardado rellena el formulario sin marcarlo para guardar otra vez", () => {
  const contact = {
    id: "01a053c5-8c3e-737c-a1b8-79a1a537288d",
    name: "María Pérez",
    bankCode: "0102",
    documentType: "V",
    documentNumber: "12345678",
    phone: "04121234567",
  };

  assert.deepEqual(recipientDataFromContact(contact), {
    name: "María Pérez",
    bankCode: "0102",
    documentType: "V",
    documentNumber: "12345678",
    phone: "04121234567",
    saveToDirectory: false,
  });
});
