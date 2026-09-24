import type { InitiatePaymentRequest } from "./types";

export function buildCoreInitiatePaymentRequest(
  request: InitiatePaymentRequest,
): Record<string, unknown> {
  const beneficiary = request.recipient.id
    ? { beneficiarioId: request.recipient.id }
    : {
        beneficiarioNuevo: {
          name: request.recipient.name,
          documentType: request.recipient.documentType,
          documentNumber: request.recipient.documentNumber,
          bankCode: request.recipient.bankCode,
          phone: request.recipient.phone,
          guardarEnDirectorio: request.recipient.saveToDirectory,
        },
      };

  return {
    ...beneficiary,
    montoBs: request.amountMinorUnits / 100,
    ...(request.concept ? { etiqueta: request.concept } : {}),
    ...(request.iconId ? { icono: request.iconId } : {}),
  };
}
