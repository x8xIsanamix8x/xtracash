export type PaymentAmountKind = "full" | "minimum";

export type PaymentReportStep =
  | "selection"
  | "amount"
  | "method"
  | "instructions"
  | "confirmation"
  | "contact"
  | "form"
  | "submitting"
  | "pending"
  | "result";

export type PaymentAmountOption = Readonly<{
  kind: PaymentAmountKind;
  label: "Pago completo" | "Pago mínimo";
  amountBs: string | null;
}>;

export type SourceBank = Readonly<{
  code: string;
  name: string;
}>;

export type PaymentReportDestination = Readonly<{
  bankName: string;
  bankCode: string;
  rif: string;
  receiverPhone: string;
}>;

export type PaymentReportData = Readonly<{
  destination: PaymentReportDestination;
  debt: Readonly<{
    currentBs: string;
    minimumBs: string;
  }>;
  sourceBanks: readonly SourceBank[];
}>;

export type CreatePaymentReportRequest = Readonly<{
  amountBs: string;
  originBankCode: string;
  senderPhone: string;
  paymentDate: string;
  bankReference: string;
  support?: PaymentReportSupport;
}>;

export type PaymentReportSupport = Readonly<{
  fileName: string;
  contentBase64: string;
}>;

export type PaymentReportResult = Readonly<{
  amountBs: string;
  supportAttached: boolean;
}>;

export type PaymentDetailKey = "bank" | "rif" | "phone" | "amount";

export type PaymentDetail = Readonly<{
  key: PaymentDetailKey;
  label: string;
  displayValue: string;
  copyValue: string;
}>;

export type PaymentReportFormErrors = Readonly<{
  originBank?: string;
  senderPhone?: string;
  paymentDate?: string;
  reference?: string;
  support?: string;
}>;
