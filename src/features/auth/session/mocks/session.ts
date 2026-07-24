import type { SessionStatus } from "../types";

type InitialSessionStatus = Exclude<SessionStatus, "signing-out">;

export const sessionMock: Readonly<{
  initialStatus: InitialSessionStatus;
  signOutDelay: number;
}> = {
  initialStatus: "active",
  signOutDelay: 600,
};
