"use client";

import { useState } from "react";
import { InstallMobileRounded, IosShareRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { usePwaInstall } from "./PwaProvider";

export function PwaInstallCard() {
  const { installAvailability, requestInstall } = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);

  if (installAvailability === "installed" || installAvailability === "unavailable") {
    return null;
  }

  const install = async () => {
    if (isPrompting) return;
    setIsPrompting(true);
    try {
      await requestInstall();
    } finally {
      setIsPrompting(false);
    }
  };

  const Icon = installAvailability === "ios" ? IosShareRounded : InstallMobileRounded;

  return (
    <Card component="section" variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent
        sx={{
          p: { xs: 2.5, sm: 3 },
          "&:last-child": { pb: { xs: 2.5, sm: 3 } },
        }}
      >
        <Stack spacing={2}>
          <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Instalar aplicación
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              })}
            >
              <Icon />
            </Box>
            {installAvailability === "ios" ? (
              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  Para agregar Impúlsate a tu pantalla de inicio:
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
                  <Typography component="li" variant="body2">Toca Compartir.</Typography>
                  <Typography component="li" variant="body2">
                    Selecciona “Agregar a pantalla de inicio”.
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Accede más rápido desde tu dispositivo y utiliza la aplicación
                en una ventana independiente.
              </Typography>
            )}
          </Stack>
          {installAvailability === "prompt" && (
            <Button
              disabled={isPrompting}
              fullWidth
              onClick={() => void install()}
              startIcon={<InstallMobileRounded />}
              type="button"
              variant="outlined"
            >
              {isPrompting ? "Preparando instalación…" : "Instalar aplicación"}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
