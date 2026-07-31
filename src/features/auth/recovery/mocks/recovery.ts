export const recoveryMock = {
  validCode: "123456",
  requestErrorIdentifier: "error@impulsate.test",
  simulationDelay: 600,
  codeLifetimeSeconds: 120,
  maximumAttempts: 3,
} as const;
