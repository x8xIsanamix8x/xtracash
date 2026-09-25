import { InstallmentsProvider } from "@/features/installments";

export default function InstallmentsLayout({ children }: LayoutProps<"/installments">) {
  return <InstallmentsProvider>{children}</InstallmentsProvider>;
}
