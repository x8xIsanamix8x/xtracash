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

export type PaymentDetailKey = "bank" | "rif" | "phone" | "amount";

export type PaymentDetail = Readonly<{
  key: PaymentDetailKey;
  label: string;
  displayValue: string;
  copyValue: string;
}>;

export type PaymentReportFormErrors = Readonly<{
  originBank?: string;
  reference?: string;
}>;
