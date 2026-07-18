import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "XtraCash",
  description: "XtraCash",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
