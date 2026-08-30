import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppProviders } from "./providers";

export const metadata: Metadata = {
  applicationName: "Impúlsate Móvil",
  title: "Impúlsate Móvil",
  description:
    "Consulta y utiliza tu línea de financiamiento desde un solo lugar.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Impúlsate",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#02004D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-VE">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
