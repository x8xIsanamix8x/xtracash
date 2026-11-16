import type { ReactNode } from "react";
import { InstallmentsProvider } from "@/features/installments";

export default function MarketplaceInstallmentsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <InstallmentsProvider>{children}</InstallmentsProvider>;
}
