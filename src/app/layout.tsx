import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "XtraCash",
  description: "XtraCash",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F5FA",
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
