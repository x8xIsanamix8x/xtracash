export type ProfileStatus = "loading" | "ready" | "error";

export type ProfileData = Readonly<{
  fullName: string;
  initials: string;
  document: string;
  email: string;
  phone: string;
}>;
