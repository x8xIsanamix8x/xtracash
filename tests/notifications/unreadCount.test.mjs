import assert from "node:assert/strict";
import test from "node:test";

import { parseUnreadCount } from "../../src/features/notifications/contractValidation.ts";

test("acepta el contrato de Core { unread: 0 } para ocultar la insignia", () => {
  assert.equal(parseUnreadCount({ unread: 0 }), 0);
});

test("acepta las formas de contador ya soportadas", () => {
  assert.equal(parseUnreadCount(3), 3);
  assert.equal(parseUnreadCount({ count: 2 }), 2);
  assert.equal(parseUnreadCount({ unreadCount: 1 }), 1);
  assert.equal(parseUnreadCount({ noLeidas: 4 }), 4);
  assert.equal(parseUnreadCount({ no_leidas: 5 }), 5);
});

test("rechaza contadores inválidos", () => {
  assert.equal(parseUnreadCount({ unread: -1 }), null);
  assert.equal(parseUnreadCount({ unread: "0" }), null);
  assert.equal(parseUnreadCount({}), null);
});
