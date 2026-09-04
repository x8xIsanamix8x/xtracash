"use client";

import { useCallback, useState } from "react";
import { FingerprintRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";

import type { StartBiometricFlow } from "../types";
import { BiometricActionControl } from "./BiometricActionControl";

type BiometricProfileSectionProps = Readonly<{
  onActivate: StartBiometricFlow;
}>;

function BottomSheetTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function BiometricProfileSection({
  onActivate,
}: BiometricProfileSectionProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog: StartBiometricFlow = useCallback(async () => {
    setIsDialogOpen(true);
  }, []);

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: "background.default",
              color: "primary.main",
            }}
          >
            <FingerprintRounded />
          </Box>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography component="h3" sx={{ fontWeight: 700 }}>
              Acceso biométrico
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Usa la seguridad de este dispositivo para ingresar más rápido.
            </Typography>
          </Stack>
        </Stack>
        <BiometricActionControl
          actionLabel="Activar acceso biométrico"
          onAction={openDialog}
        />
      </Stack>

      <Dialog
        aria-describedby="biometric-activation-description"
        aria-labelledby="biometric-activation-title"
        fullWidth
        maxWidth={false}
        onClose={() => setIsDialogOpen(false)}
        open={isDialogOpen}
        slots={{ transition: BottomSheetTransition }}
        slotProps={{
          container: {
            sx: {
              alignItems: "flex-end",
            },
          },
          paper: {
            sx: {
              m: 0,
              width: { xs: "100%", sm: "min(600px, calc(100% - 48px))" },
              maxWidth: "100%",
              height: {
                xs: "min(76dvh, calc(100dvh - 24px - env(safe-area-inset-top)))",
                sm: "min(680px, 76dvh)",
              },
              maxHeight: "100dvh",
              borderRadius: "28px 28px 0 0",
              overflow: "hidden",
            },
          },
        }}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
      >
        <DialogContent
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            px: { xs: 3, sm: 4 },
            pt: { xs: 3.5, sm: 4 },
            pb: "calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: 12,
              left: "50%",
              width: 48,
              height: 5,
              borderRadius: 999,
              bgcolor: "divider",
              transform: "translateX(-50%)",
            }}
          />
          <Stack sx={{ minHeight: 0, flex: 1 }}>
            <Box sx={{ flex: 1, display: "grid", placeItems: "center", py: 3 }}>
              <Stack
                spacing={3}
                sx={{ width: "100%", maxWidth: 480, alignItems: "center", textAlign: "center" }}
              >
                <Box
                  aria-hidden="true"
                  sx={(theme) => ({
                    width: 112,
                    height: 112,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  })}
                >
                  <FingerprintRounded sx={{ width: 68, height: 68 }} />
                </Box>
                <Stack spacing={1.25}>
                  <DialogTitle
                    component="h2"
                    id="biometric-activation-title"
                    sx={{ p: 0, color: "secondary.main", fontWeight: 700 }}
                  >
                    Activa el acceso biométrico
                  </DialogTitle>
                  <DialogContentText id="biometric-activation-description">
                    Usa la seguridad de este dispositivo para ingresar más rápido.
                  </DialogContentText>
                </Stack>
              </Stack>
            </Box>
            <Stack spacing={1.25} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
              <BiometricActionControl
                actionLabel="Activar acceso biométrico"
                buttonVariant="contained"
                onAction={onActivate}
              />
              <Button
                color="secondary"
                fullWidth
                onClick={() => setIsDialogOpen(false)}
                type="button"
                variant="text"
              >
                Ahora no
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
