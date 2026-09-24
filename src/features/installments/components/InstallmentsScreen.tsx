import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";

import {
  APP_BOTTOM_NAVIGATION_HEIGHT,
  AppBottomNavigation,
} from "@/components/AppBottomNavigation";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";

/** Marco de las pantallas de Cuotas: mismo fondo y márgenes que el Home. */
export function InstallmentsScreen({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
      <AppBottomNavigation activeItem="installments" />
    </Box>
  );
}
