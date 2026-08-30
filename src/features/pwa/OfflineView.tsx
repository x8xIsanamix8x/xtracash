"use client";

import { useEffect, useRef } from "react";
import { CloudOffRounded } from "@mui/icons-material";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useOnlineStatus } from "./useOnlineStatus";

export function OfflineView() {
  const isOnline = useOnlineStatus();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        py: "calc(24px + env(safe-area-inset-top))",
        pb: "calc(24px + env(safe-area-inset-bottom))",
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography sx={{ color: "secondary.main", fontWeight: 800 }}>
            Impúlsate Móvil
          </Typography>
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              width: 80,
              height: 80,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            })}
          >
            <CloudOffRounded sx={{ width: 44, height: 44 }} />
          </Box>
          <Stack spacing={1.5}>
            <Typography
              component="h1"
              ref={titleRef}
              tabIndex={-1}
              variant="h3"
              sx={{ color: "secondary.main", outline: "none" }}
            >
              Sin conexión
            </Typography>
            <Typography color="text.secondary">
              No pudimos conectarnos a internet. Verifica tu conexión e
              inténtalo nuevamente.
            </Typography>
          </Stack>
          <Button
            fullWidth
            onClick={() => window.location.reload()}
            sx={{ maxWidth: 360 }}
            type="button"
            variant="contained"
          >
            Reintentar
          </Button>
          <Box aria-live="polite" role="status" sx={{ minHeight: "1.5em" }}>
            {isOnline && (
              <Typography color="text.secondary" variant="body2">
                La conexión está disponible. Puedes reintentar.
              </Typography>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
