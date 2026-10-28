export type Nationality = "V" | "E";

export type RegistrationData = Readonly<{
  nationality: Nationality | "";
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}>;

export type RegistrationRequest = Readonly<{
  documentType: Nationality;
  documentNumber: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  termsAccepted: true;
}>;

export type RegistrationFlowState =
  | Readonly<{ name: "identification" }>
  | Readonly<{ name: "contactSecurity" }>
  | Readonly<{ name: "review" }>
  | Readonly<{ name: "submitting" }>;

export type RegistrationField = keyof RegistrationData;
export type RegistrationUiField = RegistrationField | "phoneOperatorCode" | "phoneLocalNumber";
export type RegistrationErrors = Partial<Record<RegistrationUiField, string>>;

export type RegistrationInputRefs = Readonly<
  Partial<Record<RegistrationUiField, React.RefObject<HTMLInputElement | null>>>
>;
