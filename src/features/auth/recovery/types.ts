export type RecoveryStep = 0 | 1 | 2;

export type RecoveryData = Readonly<{
  identifier: string;
  password: string;
  passwordConfirmation: string;
}>;

export type RecoveryField = keyof RecoveryData;
export type RecoveryErrors = Partial<Record<RecoveryField, string>>;
