import type { ReactNode } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

export const pillButton = {
  minHeight: 48,
  px: 3,
  borderRadius: 99,
  bgcolor: "#4637F5",
  fontWeight: 600,
  "&:hover, &:active": { bgcolor: "#4637F5" },
} as const;

/** Tarjeta de estado de Cuotas: vacío, error o no encontrado. */
export function StateCard({
  icon,
  title,
  description,
  action,
}: Readonly<{
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}>) {
  return (
    <Card
      role="status"
      variant="outlined"
      sx={{
        borderColor: homeVisualTokens.color.lavender,
        borderRadius: `${homeVisualTokens.radius.card}px`,
        bgcolor: homeVisualTokens.color.white,
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 72,
              height: 72,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: homeVisualTokens.color.surfaceTint,
              color: homeVisualTokens.color.violet,
              "& svg": { fontSize: 36 },
            }}
          >
            {icon}
          </Box>
          <Typography
            component="h2"
            sx={{ color: homeVisualTokens.color.navy, fontSize: "1.125rem", fontWeight: 600 }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: homeVisualTokens.color.neutral }}>{description}</Typography>
          {action}
        </Stack>
      </CardContent>
    </Card>
  );
}
