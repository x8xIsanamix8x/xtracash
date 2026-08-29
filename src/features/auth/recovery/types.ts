export type RecoveryData = Readonly<{
  identifier: string;
}>;

export type RecoveryRequest = Readonly<{
  identifier: string;
}>;

export type AuthenticatedRecoveryRequest = Readonly<{
  source: "profile";
}>;

export type RecoveryApiRequest = RecoveryRequest | AuthenticatedRecoveryRequest;
