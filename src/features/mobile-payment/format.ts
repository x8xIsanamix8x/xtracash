import type { Bank, DocumentType } from "./types";

export function getBank(
  banks: readonly Bank[],
  bankCode: string,
) {
  return banks.find((bank) => bank.code === bankCode);
}

export function formatBank(bank: Bank) {
  return `${bank.code} · ${bank.name}`;
}

export function formatMinorUnits(minorUnits: number) {
  const wholeUnits = Math.floor(minorUnits / 100);
  const decimals = String(minorUnits % 100).padStart(2, "0");
  const groupedWholeUnits = groupWholeUnits(String(wholeUnits));

  return `Bs. ${groupedWholeUnits},${decimals}`;
}

export function formatBsAmount(amount: string) {
  const minorUnits = parseAmountToMinorUnits(amount);
  return minorUnits === null ? "Bs. 0,00" : formatMinorUnits(minorUnits);
}

function groupWholeUnits(wholeUnits: string) {
  return wholeUnits.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );
}

function getDecimalSeparatorIndex(value: string) {
  const commaIndex = value.indexOf(",");

  if (commaIndex !== -1) {
    return commaIndex;
  }

  const dotIndexes = [...value.matchAll(/\./g)].map(
    (match) => match.index,
  );

  if (dotIndexes.length === 0) {
    return -1;
  }

  const lastDotIndex = dotIndexes.at(-1) ?? -1;
  const digitsAfterLastDot = value
    .slice(lastDotIndex + 1)
    .replace(/\D/g, "").length;
  const isGroupedInteger = /^\d{1,3}(?:\.\d{3})+$/.test(value);

  if (isGroupedInteger) {
    return -1;
  }

  return digitsAfterLastDot <= 2 ? lastDotIndex : -1;
}

export function formatAmountInput(rawValue: string) {
  const sanitizedValue = rawValue.replace(/[^\d.,]/g, "");

  if (!sanitizedValue) {
    return "";
  }

  const decimalSeparatorIndex =
    getDecimalSeparatorIndex(sanitizedValue);
  const hasDecimalSeparator = decimalSeparatorIndex !== -1;
  const wholeValue = (
    hasDecimalSeparator
      ? sanitizedValue.slice(0, decimalSeparatorIndex)
      : sanitizedValue
  ).replace(/\D/g, "");
  const decimalValue = hasDecimalSeparator
    ? sanitizedValue
      .slice(decimalSeparatorIndex + 1)
      .replace(/\D/g, "")
      .slice(0, 2)
    : "";
  const normalizedWholeValue =
    wholeValue.replace(/^0+(?=\d)/, "") || "0";
  const groupedWholeValue = groupWholeUnits(normalizedWholeValue);

  return hasDecimalSeparator
    ? `${groupedWholeValue},${decimalValue}`
    : groupedWholeValue;
}

export function parseAmountToMinorUnits(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  let wholeValue: string;
  let decimalValue = "";

  if (normalizedValue.includes(",")) {
    if (
      !/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(
        normalizedValue,
      )
    ) {
      return null;
    }

    const [wholePart, decimalPart] = normalizedValue.split(",");
    wholeValue = wholePart.replace(/\./g, "");
    decimalValue = decimalPart;
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(normalizedValue)) {
    wholeValue = normalizedValue.replace(/\./g, "");
  } else if (/^\d+\.\d{1,2}$/.test(normalizedValue)) {
    [wholeValue, decimalValue] = normalizedValue.split(".");
  } else if (/^\d+$/.test(normalizedValue)) {
    wholeValue = normalizedValue;
  } else {
    return null;
  }

  const wholeMinorUnits = Number(wholeValue) * 100;
  const decimalMinorUnits = Number(decimalValue.padEnd(2, "0"));
  const minorUnits = wholeMinorUnits + decimalMinorUnits;

  return Number.isSafeInteger(minorUnits) ? minorUnits : null;
}

export function formatAmountOnBlur(value: string) {
  const minorUnits = parseAmountToMinorUnits(value);

  if (minorUnits === null) {
    return value;
  }

  return formatMinorUnits(minorUnits).replace(/^Bs\. /, "");
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 4)} ••• ${phone.slice(-4)}`;
}

export function formatPhone(phone: string) {
  return `${phone.slice(0, 4)}-${phone.slice(4)}`;
}

export function maskDocument(
  documentType: DocumentType,
  documentNumber: string,
) {
  return `${documentType}-••.•••.${documentNumber.slice(-3)}`;
}

export function formatDocument(
  documentType: DocumentType,
  documentNumber: string,
) {
  return `${documentType}-${groupWholeUnits(documentNumber)}`;
}

export function formatTransactionDate(transactionDate: string) {
  const date = new Date(transactionDate);
  const dateLabel = new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timeParts = new Intl.DateTimeFormat("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod = timeParts
    .find((part) => part.type === "dayPeriod")
    ?.value.replace(/\s/g, "\u00a0") ?? "";

  return {
    date: dateLabel,
    time: `${hour}:${minute}\u00a0${dayPeriod}`,
  } as const;
}
