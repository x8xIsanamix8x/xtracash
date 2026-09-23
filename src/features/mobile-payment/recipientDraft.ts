import type { DirectoryContact, ManualRecipientData } from "./types";

export function recipientDataFromContact(
  contact: DirectoryContact,
): ManualRecipientData {
  return {
    bankCode: contact.bankCode,
    documentType: contact.documentType,
    documentNumber: contact.documentNumber,
    phone: contact.phone,
    name: contact.name,
    saveToDirectory: false,
  };
}
