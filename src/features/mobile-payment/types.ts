export type MobilePaymentStep = "details" | "review" | "result";

export type TransferResultStatus = "success" | "processing" | "rejected";

export type RecipientMode = "choice" | "manual" | "directory";

export type DirectoryStatus = "loading" | "ready" | "error" | "empty";

export type Nationality = "V" | "E";

export type Bank = Readonly<{
  code: string;
  name: string;
}>;

export type DirectoryContact = Readonly<{
  id: string;
  name: string;
  bankCode: string;
  nationality: Nationality;
  documentNumber: string;
  phone: string;
}>;

export type ManualRecipientData = Readonly<{
  bankCode: string;
  nationality: Nationality;
  documentNumber: string;
  phone: string;
  saveToDirectory: boolean;
  alias: string;
}>;

export type DetailsField =
  | "recipient"
  | "bankCode"
  | "documentNumber"
  | "phone"
  | "alias"
  | "amount";

export type DetailsErrors = Partial<Record<DetailsField, string>>;

export type ResolvedRecipient = Readonly<{
  name: string;
  bankCode: string;
  nationality: Nationality;
  documentNumber: string;
  phone: string;
  saveToDirectory: boolean;
  alias: string;
}>;

export type TransferResult = Readonly<{
  status: TransferResultStatus;
  amountMinorUnits: number;
  beneficiaryName: string;
  bankCode: string;
  bankName: string;
  nationality: Nationality;
  documentNumber: string;
  phone: string;
  transactionDate: string;
  bankReference?: string;
  userMessage?: string;
}>;

export type TransferRequest = Readonly<{
  amountMinorUnits: number;
  beneficiaryName: string;
  bankCode: string;
  bankName: string;
  nationality: Nationality;
  documentNumber: string;
  phone: string;
}>;
