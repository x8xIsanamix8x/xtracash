import { ProfileView } from "@/features/profile";
import { headers } from "next/headers";
import { isBiometricPrototypeEnabled } from "@/features/biometric-access/server/prototypeConfiguration";

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const [requestHeaders, query] = await Promise.all([headers(), searchParams]);
  const host = requestHeaders.get("host");
  return (
    <ProfileView
      biometricEnabled={isBiometricPrototypeEnabled(host)}
      initialTab={query.tab === "install" ? "install" : "information"}
    />
  );
}
