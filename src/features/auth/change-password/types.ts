export type VerificationMethod = "current-password" | "code";
export type ChangePasswordStep = "verification" | "new-password";

export type ChangePasswordData = Readonly<{
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}>;

export type ChangePasswordField = keyof ChangePasswordData;
export type ChangePasswordErrors = Partial<Record<ChangePasswordField, string>>;
