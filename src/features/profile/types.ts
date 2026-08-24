export type ProfileStatus = "loading" | "ready" | "error";

export type ProfilePersonalInfo = Readonly<{
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
}>;

export type ProfileData = Readonly<{
  fullName: string;
  initials: string;
  document: string;
  email: string;
  phone: string;
}>;
