import type { NotificationItem, NotificationsPage } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key].trim()) {
      return record[key].trim();
    }
  }
  return null;
}

function parseAmount(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) {
    return Number(value).toFixed(2);
  }
  if (isRecord(value)) {
    return parseAmount(value.bs ?? value.montoBs);
  }
  return undefined;
}

export function parseNotification(value: unknown): NotificationItem | null {
  if (!isRecord(value)) return null;

  const id = firstString(value, ["id", "notificationId"]);
  const subject = firstString(value, ["subject", "title", "asunto"]);
  const message = firstString(value, ["message", "mensaje", "body"]);
  const occurredAt = firstString(value, ["date", "createdAt", "fecha", "occurredAt"]);
  const readValue = value.isRead ?? value.read ?? value.leida ?? value.leído;
  const amountBs = parseAmount(value.amountBs ?? value.montoBs ?? value.amount ?? value.monto);
  const type = firstString(value, ["type", "tipo", "eventType"]);
  const operationId = firstString(value, ["operationId", "relatedOperationId", "operation_id"]);

  if (
    !id
    || !subject
    || !message
    || !occurredAt
    || !Number.isFinite(Date.parse(occurredAt))
    || typeof readValue !== "boolean"
    || amountBs === undefined
  ) {
    return null;
  }

  return { id, subject, message, occurredAt, isRead: readValue, amountBs, type, operationId };
}

export function parseNotificationsPage(value: unknown): NotificationsPage | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items = value.items.map(parseNotification);
  const page = value.page;
  const size = value.size;
  const total = value.total;
  if (
    items.some((item) => item === null)
    || !Number.isInteger(page)
    || !Number.isInteger(size)
    || !Number.isInteger(total)
    || (page as number) < 0
    || (size as number) < 1
    || (total as number) < items.length
  ) {
    return null;
  }
  return { items: items as NotificationItem[], page: page as number, size: size as number, total: total as number };
}

export function parseUnreadCount(value: unknown): number | null {
  if (Number.isInteger(value) && (value as number) >= 0) return value as number;
  if (!isRecord(value)) return null;
  const count = value.count ?? value.unread ?? value.unreadCount ?? value.noLeidas ?? value.no_leidas;
  return Number.isInteger(count) && (count as number) >= 0 ? count as number : null;
}
