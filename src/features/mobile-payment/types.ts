export type MobilePaymentStep = "details" | "review" | "result";

export type TransferResultStatus = "success" | "processing" | "rejected";

export type RecipientMode = "choice" | "manual" | "directory";

export type DirectoryStatus = "loading" | "ready" | "error" | "empty";

export type DocumentType = "V" | "J";

export type Bank = Readonly<{
  code: string;
  name: string;
}>;

export type DirectoryContact = Readonly<{
  id: string;
  name: string;
  bankCode: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
}>;

export type ManualRecipientData = Readonly<{
  bankCode: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  saveToDirectory: boolean;
  name: string;
}>;

export type DetailsField =
  | "recipient"
  | "bankCode"
  | "documentNumber"
  | "phone"
  | "name"
  | "amount";

export type DetailsErrors = Partial<Record<DetailsField, string>>;

export type ResolvedRecipient = Readonly<{
  id: string | null;
  name: string;
  bankCode: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  saveToDirectory: boolean;
}>;

export type InitiatedPayment = Readonly<{
  operationId: string;
  status: string;
  channel: "MISMO_BANCO" | "OTRA_ENTIDAD";
  amountBs: string;
  feeBs: string;
  feePercentage: string;
  totalBs: string;
  rateValue: string;
  rateDate: string;
  rateSource: string;
  expiresAt: string;
  availableBs: string;
  recipient: ResolvedRecipient;
}>;

export type ConfirmedPayment = Readonly<{
  operationId: string;
  status: string;
  bankReference: string | null;
  amountBs: string;
  totalBs: string;
  resolvedAt: string | null;
  message: string | null;
}>;

export type TransferResult = Readonly<{
  status: TransferResultStatus;
  amountMinorUnits: number;
  beneficiaryName: string;
  bankCode: string;
  bankName: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  transactionDate: string | null;
  bankReference?: string;
  userMessage?: string;
}>;

export type InitiatePaymentRequest = Readonly<{
  amountMinorUnits: number;
  recipient: ResolvedRecipient;
}>;

export type MobilePaymentOptions = Readonly<{
  banks: readonly Bank[];
  contacts: readonly DirectoryContact[];
}>;
