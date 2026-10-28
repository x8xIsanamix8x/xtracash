import { EntryFlow } from "@/features/entry";
import { headers } from "next/headers";
import { isBiometricPrototypeEnabled } from "@/features/biometric-access/server/prototypeConfiguration";

export default async function Home() {
  const host = (await headers()).get("host");
  return <EntryFlow biometricEnabled={isBiometricPrototypeEnabled(host)} />;
}
