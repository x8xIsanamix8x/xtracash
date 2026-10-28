"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";

import { AuthSessionMonitor } from "@/features/auth/session/components/AuthSessionMonitor";
import { PwaProvider } from "@/features/pwa/PwaProvider";
import { theme } from "@/theme";

type AppProvidersProps = Readonly<{
  children: ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PwaProvider>
          <AuthSessionMonitor />
          {children}
        </PwaProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
