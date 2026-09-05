import { ProfileView } from "@/features/profile";
import { headers } from "next/headers";
import { isBiometricPrototypeEnabled } from "@/features/biometric-access/server/prototypeConfiguration";

export default async function ProfilePage() {
  const host = (await headers()).get("host");
  return <ProfileView biometricEnabled={isBiometricPrototypeEnabled(host)} />;
}
