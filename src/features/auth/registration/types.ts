export type Nationality = "V" | "E";

export type RegistrationData = Readonly<{
  nationality: Nationality;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}>;

export type RegistrationField = keyof RegistrationData;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

export type RegistrationInputRefs = Readonly<
  Partial<Record<RegistrationField, React.RefObject<HTMLInputElement | null>>>
>;
