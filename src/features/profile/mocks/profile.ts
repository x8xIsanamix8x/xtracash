import type { ProfileData, ProfileStatus } from "../types";

export const profileMock: Readonly<{
  initialStatus: ProfileStatus;
  retryDelay: number;
  user: ProfileData;
}> = {
  initialStatus: "ready",
  retryDelay: 600,
  user: {
    fullName: "Andrés González",
    initials: "AG",
    document: "V-12.345.678",
    email: "andres@xtracash.test",
    phone: "0412 123 4567",
  },
};
