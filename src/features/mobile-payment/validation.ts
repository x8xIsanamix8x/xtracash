import type {
  DetailsErrors,
  DetailsField,
  ManualRecipientData,
  RecipientMode,
} from "./types";
import { parseAmountToMinorUnits } from "./format";

type AmountValidation =
  | Readonly<{ minorUnits: number; error?: never }>
  | Readonly<{ minorUnits?: never; error: string }>;

type DetailsValidationInput = Readonly<{
  recipientMode: RecipientMode;
  manualRecipient: ManualRecipientData;
  selectedContactId: string | null;
  amount: string;
  availableMinorUnits: number;
}>;

export type DetailsValidationResult = Readonly<{
  errors: DetailsErrors;
  firstInvalidField: DetailsField | null;
  amountMinorUnits: number | null;
}>;

/**
 * Validación preliminar. El backend deberá validar atómicamente monto más flat,
 * estado de la línea, disponible utilizable y liquidez real.
 */
export function validateAmount(
  amount: string,
  availableMinorUnits: number,
): AmountValidation {
  const normalizedAmount = amount.trim();

  if (!normalizedAmount) {
    return { error: "Ingresa el monto a enviar." };
  }

  const minorUnits = parseAmountToMinorUnits(normalizedAmount);

  if (minorUnits === null) {
    return {
      error: "Ingresa un monto válido con máximo dos decimales.",
    };
  }

  if (minorUnits === 0) {
    return { error: "El monto debe ser mayor que cero." };
  }

  if (minorUnits > availableMinorUnits) {
    return { error: "El monto supera tu disponible." };
  }

  return { minorUnits };
}

export function validateDetails({
  recipientMode,
  manualRecipient,
  selectedContactId,
  amount,
  availableMinorUnits,
}: DetailsValidationInput): DetailsValidationResult {
  const errors: DetailsErrors = {};
  const fieldOrder: DetailsField[] = [];

  if (recipientMode === "choice") {
    errors.recipient = "Selecciona cómo ingresar el destinatario.";
    fieldOrder.push("recipient");
  } else if (recipientMode === "directory") {
    if (selectedContactId === null) {
      errors.recipient = "Selecciona un contacto del directorio.";
      fieldOrder.push("recipient");
    }
  } else {
    if (!manualRecipient.bankCode) {
      errors.bankCode = "Selecciona el banco destino.";
      fieldOrder.push("bankCode");
    }

    if (!/^\d{6,8}$/.test(manualRecipient.documentNumber.trim())) {
      errors.documentNumber = "Ingresa un documento de 6 a 8 dígitos.";
      fieldOrder.push("documentNumber");
    }

    if (!/^\d{11}$/.test(manualRecipient.phone.trim())) {
      errors.phone = "Ingresa un teléfono de 11 dígitos.";
      fieldOrder.push("phone");
    }

    if (
      manualRecipient.saveToDirectory
      && !manualRecipient.alias.trim()
    ) {
      errors.alias = "Ingresa un nombre o alias.";
      fieldOrder.push("alias");
    }
  }

  const amountValidation = validateAmount(amount, availableMinorUnits);

  if (amountValidation.error) {
    errors.amount = amountValidation.error;
    fieldOrder.push("amount");
  }

  return {
    errors,
    firstInvalidField: fieldOrder[0] ?? null,
    amountMinorUnits: amountValidation.minorUnits ?? null,
  };
}
