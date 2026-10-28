import { RecoveryView } from "@/features/auth";

export default async function RecoverPasswordPage({ searchParams }: Readonly<{
  searchParams: Promise<{ mode?: string | string[] }>;
}>) {
  const { mode } = await searchParams;
  return <RecoveryView mode={mode === "activation" ? "activation" : "recovery"} />;
}
