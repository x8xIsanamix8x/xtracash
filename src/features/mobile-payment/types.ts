import type { PaymentIconId } from "../payment-purpose/types";

export type MobilePaymentStep = "details" | "review" | "result";

export type TransferResultStatus = "success" | "processing" | "rejected";

export type MobilePaymentAccessStatus =
  | "active"
  | "suspended"
  | "blocked";

export type RecipientMode = "choice" | "manual" | "directory";

export type { PaymentIconId } from "../payment-purpose/types";

export type PaymentPurposeDraft = Readonly<{
  concept: string;
  iconId: PaymentIconId | null;
}>;

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

export type FinancingInstallment = Readonly<{
  number: number;
  dueDate: string;
  amountBs: string;
}>;

export type FinancingPlan = Readonly<{
  level: number;
  installmentCount: number;
  debtBs: string;
  paymentEveryDays: number;
  totalTermDays: number;
  interestFreeDays: number;
  monthlyInterestRate: string;
  dailyInterestRate: string;
  annualInterestRate: string;
  monthlyLateFeeRate: string;
  dailyLateFeeRate: string;
  reconnectionFeeBs: string;
  installments: readonly FinancingInstallment[];
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
  label: string;
  iconId: PaymentIconId | null;
  recipientBankName: string;
  financing: FinancingPlan;
  recipient: ResolvedRecipient;
}>;

export type ConfirmedRecipient = Readonly<{
  name: string;
  bankCode: string;
  phone: string;
}>;

export type ConfirmedPayment = Readonly<{
  operationId: string;
  status: string;
  isPending: boolean;
  label: string;
  bankReference: string | null;
  amountBs: string;
  totalBs: string;
  feeBs: string;
  feePercentage: string;
  recipientBankName: string;
  recipient: ConfirmedRecipient;
  resolvedAt: string | null;
  message: string | null;
}>;

export type TransferResult = Readonly<{
  status: TransferResultStatus;
  amountMinorUnits: number;
  totalMinorUnits: number;
  feeMinorUnits: number;
  feePercentage: string;
  label: string;
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
  concept: string;
  iconId: PaymentIconId | null;
  recipient: ResolvedRecipient;
}>;

export type MobilePaymentOptions = Readonly<{
  banks: readonly Bank[];
  contacts: readonly DirectoryContact[];
}>;

export type MobilePaymentContext = MobilePaymentOptions & Readonly<{
  availableBs: string;
  accessStatus: MobilePaymentAccessStatus;
}>;
