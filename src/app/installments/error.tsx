"use client";

import { Button, Stack, Typography } from "@mui/material";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

export default function InstallmentsError({
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  return (
    <Stack
      component="main"
      role="alert"
      spacing={2}
      sx={{
        minHeight: "100dvh",
        px: 3,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        bgcolor: homeVisualTokens.color.surfaceTint,
      }}
    >
      <Typography component="h1" sx={{ color: homeVisualTokens.color.navy, fontSize: "1.25rem", fontWeight: 800 }}>
        Algo salió mal
      </Typography>
      <Typography sx={{ color: homeVisualTokens.color.neutral }}>
        No pudimos mostrar tus cuotas. Inténtalo nuevamente.
      </Typography>
      <Button onClick={unstable_retry} variant="contained">
        Reintentar
      </Button>
    </Stack>
  );
}
