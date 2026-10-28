import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";

import {
  APP_BOTTOM_NAVIGATION_HEIGHT,
  AppBottomNavigation,
} from "@/components/AppBottomNavigation";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";

const bottomSpace = `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 24}px + env(safe-area-inset-bottom))`;

/**
 * Panel blanco que baja hasta la barra de navegación (Figma 13): ocupa el alto que sobra,
 * se come el margen inferior de la pantalla y guarda ese espacio por dentro.
 * El padre debe ser una columna flex (`panelSlotSx`).
 */
export const panelToBottomSx = {
  flex: 1,
  mb: `calc(-1 * ${bottomSpace})`,
  pb: bottomSpace,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
} as const;

/** Hueco donde va el panel: columna flex que llena el alto disponible. */
export const panelSlotSx = { flex: 1, display: "flex", flexDirection: "column" } as const;

/** Marco de las pantallas de Cuotas: mismo fondo y márgenes que el Home. */
export function InstallmentsScreen({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: bottomSpace,
      }}
    >
      <Container maxWidth="sm" sx={{ ...panelSlotSx, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
      <AppBottomNavigation activeItem="installments" />
    </Box>
  );
}
