import "server-only";

import {
  isCalendarDate,
  isCreditMovementStatus,
  isCreditMovementType,
} from "../contractValidation";
import type { CreditMovementQuery } from "../types";

const allowedParameters = new Set([
  "type",
  "status",
  "from",
  "to",
  "q",
  "page",
  "size",
]);
const integerPattern = /^(0|[1-9]\d*)$/;

function readUniqueValue(
  searchParams: URLSearchParams,
  name: string,
): string | null | "invalid" {
  const values = searchParams.getAll(name);
  if (values.length === 0) return null;
  if (values.length > 1 || !values[0]) return "invalid";
  return values[0];
}

function readInteger(
  value: string | null,
  fallback: number,
  allowZero: boolean,
): number | null {
  if (value === null) return fallback;
  if (!integerPattern.test(value)) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || (!allowZero && number === 0)) return null;
  return number;
}

export function parseCreditMovementQuery(
  searchParams: URLSearchParams,
): CreditMovementQuery | null {
  for (const key of searchParams.keys()) {
    if (!allowedParameters.has(key)) return null;
  }

  const type = readUniqueValue(searchParams, "type");
  const status = readUniqueValue(searchParams, "status");
  const from = readUniqueValue(searchParams, "from");
  const to = readUniqueValue(searchParams, "to");
  const q = readUniqueValue(searchParams, "q");
  const pageValue = readUniqueValue(searchParams, "page");
  const sizeValue = readUniqueValue(searchParams, "size");
  if (
    type === "invalid"
    || status === "invalid"
    || from === "invalid"
    || to === "invalid"
    || q === "invalid"
    || pageValue === "invalid"
    || sizeValue === "invalid"
    || (type !== null && !isCreditMovementType(type))
    || (status !== null && !isCreditMovementStatus(status))
    || (from !== null && !isCalendarDate(from))
    || (to !== null && !isCalendarDate(to))
    || (from !== null && to !== null && from > to)
  ) {
    return null;
  }

  const page = readInteger(pageValue, 0, true);
  const size = readInteger(sizeValue, 20, false);
  if (page === null || size === null) return null;

  return {
    ...(type === null ? {} : { type }),
    ...(status === null ? {} : { status }),
    ...(from === null ? {} : { from }),
    ...(to === null ? {} : { to }),
    ...(q === null ? {} : { q }),
    page,
    size,
  };
}
