"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloseRounded, HelpOutlineRounded } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Fade,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { darken, lighten } from "@mui/material/styles";

import { SignInSheet } from "@/features/auth";
import { PUBLIC_RECOVERY_SUCCESS_MESSAGE } from "@/features/auth/recovery/presentation";
import type {
  AccessNavigationRequest,
  AccessNotification,
} from "@/lib/accessNotificationNavigation";
import { resetMasterOnboardingPrompt } from "@/features/master-onboarding";
import { themeTokens } from "@/theme/tokens";

type AccessViewProps = Readonly<{
  biometricEnabled?: boolean;
  accessRequest: AccessNavigationRequest | null;
  onAccessRequestConsumed: () => void;
}>;

const pillButton = {
  minHeight: 50,
  borderRadius: "999px",
  fontWeight: 400,
  "&:focus-visible": {
    outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
    outlineOffset: 2,
  },
} as const;

const accessNotificationContent: Readonly<
  Record<AccessNotification, Readonly<{ closeLabel: string; message: string; title: string }>>
> = {
  registrationSubmitted: {
    closeLabel: "Cerrar aviso de registro",
    title: "Registro procesado correctamente",
    message:
      "Revisa tu bandeja de entrada o correo no deseado y utiliza el enlace recibido para activar tu cuenta antes de iniciar sesión.",
  },
  recoveryRequested: {
    closeLabel: "Cerrar aviso de recuperación",
    title: "Revisa tu correo",
    message: PUBLIC_RECOVERY_SUCCESS_MESSAGE,
  },
  sessionExpired: {
    closeLabel: "Cerrar aviso de sesión expirada",
    title: "Tu sesión ha expirado",
    message: "Por seguridad, inicia sesión nuevamente para continuar.",
  },
};

export function AccessView({
  biometricEnabled = false,
  accessRequest,
  onAccessRequestConsumed,
}: AccessViewProps) {
  const router = useRouter();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [visibleAccessNotification, setVisibleAccessNotification] =
    useState<AccessNotification | null>(null);
  const [isAccessNotificationOpen, setIsAccessNotificationOpen] = useState(false);
  const accessNotificationHandledRef = useRef(false);

  useEffect(() => {
    if (!accessRequest || accessNotificationHandledRef.current) return;

    accessNotificationHandledRef.current = true;
    setIsSignInOpen(true);
    setVisibleAccessNotification(accessRequest.notification);
    setIsAccessNotificationOpen(Boolean(accessRequest.notification));
    onAccessRequestConsumed();
  }, [accessRequest, onAccessRequestConsumed]);

  const notificationContent = visibleAccessNotification
    ? accessNotificationContent[visibleAccessNotification]
    : null;

  const openSignIn = () => {
    setIsSignInOpen(true);
  };

  const closeSignIn = () => {
    setIsSignInOpen(false);
  };

  const completeSignIn = () => {
    resetMasterOnboardingPrompt();
    router.replace("/home");
  };

  const closeAccessNotification = () => {
    setIsAccessNotificationOpen(false);
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          // Fija a la pantalla completa: en la PWA de iOS, 100dvh no cubre la franja de abajo.
          position: "fixed",
          inset: 0,
          isolation: "isolate",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: themeTokens.color.preLoginBackground,
          backgroundImage:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0) 64%, #FFFFFF 91.6%), url('/entry/login-waves-background.webp')",
          backgroundSize: "100% 100%, cover",
          backgroundPosition: "center, center",
        }}
      >
        <Stack
          direction="row"
          sx={{
            width: "100%",
            maxWidth: 720,
            mx: "auto",
            minHeight: 48,
            alignItems: "center",
            justifyContent: "flex-end",
            pt: "calc(12px + env(safe-area-inset-top))",
            pr: "calc(16px + env(safe-area-inset-right))",
            pl: "calc(16px + env(safe-area-inset-left))",
          }}
        >
          <IconButton
            aria-label="Ayuda"
            component={Link}
            href="/help"
            sx={{ color: themeTokens.color.preLoginNavy }}
          >
            <HelpOutlineRounded />
          </IconButton>
        </Stack>

        <Stack
          spacing={2}
          sx={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pt: "clamp(0px, 10dvh, 96px)",
            px: 3,
          }}
        >
          <Box
            alt=""
            component="img"
            src="/entry/isotipo-impulsa.png"
            sx={{
              width: 74,
              height: "auto",
              display: "block",
              "@media (max-height: 650px)": {
                width: 56,
              },
            }}
          />
          <Typography
            component="h1"
            sx={{
              color: themeTokens.color.preLoginNavy,
              fontSize: "1.75rem",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            IMPÚLSATE MÓVIL
          </Typography>
        </Stack>

        <Stack
          spacing="9px"
          sx={{
            width: "100%",
            maxWidth: 520,
            mx: "auto",
            pt: 3,
            pr: "calc(19px + env(safe-area-inset-right))",
            pb: "calc(21px + env(safe-area-inset-bottom))",
            pl: "calc(19px + env(safe-area-inset-left))",
            "@media (max-height: 650px)": {
              pt: 2,
              pb: "calc(16px + env(safe-area-inset-bottom))",
            },
          }}
        >
          <Button
            fullWidth
            onClick={openSignIn}
            variant="contained"
            sx={{
              ...pillButton,
              bgcolor: themeTokens.color.preLoginPrimary,
              "&:hover": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.12) },
              "&:active": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.2) },
            }}
          >
            Iniciar sesión
          </Button>
          <Button
            fullWidth
            color="secondary"
            component={Link}
            href="/register"
            variant="contained"
            sx={{
              ...pillButton,
              bgcolor: themeTokens.color.preLoginNavy,
              "&:hover": { bgcolor: lighten(themeTokens.color.preLoginNavy, 0.12) },
              "&:active": { bgcolor: lighten(themeTokens.color.preLoginNavy, 0.2) },
            }}
          >
            Registrarme
          </Button>
        </Stack>
      </Box>

      <SignInSheet
        biometricEnabled={biometricEnabled}
        notification={(
          <Snackbar
            anchorOrigin={{ horizontal: "center", vertical: "top" }}
            autoHideDuration={9000}
            onClose={(_event, reason) => {
              if (reason !== "clickaway") closeAccessNotification();
            }}
            open={isAccessNotificationOpen}
            slotProps={{
              transition: {
                onExited: () => setVisibleAccessNotification(null),
              },
            }}
            slots={{ transition: Fade }}
            sx={{
              position: "static",
              inset: "auto",
              boxSizing: "border-box",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              flexShrink: 0,
              transform: "none !important",
            }}
            transitionDuration={prefersReducedMotion ? 0 : { enter: 220, exit: 420 }}
          >
            <Alert
              action={
                <IconButton
                  aria-label={notificationContent?.closeLabel}
                  color="inherit"
                  onClick={closeAccessNotification}
                  size="small"
                >
                  <CloseRounded fontSize="small" />
                </IconButton>
              }
              aria-live="polite"
              role="status"
              severity="success"
              sx={{
                boxSizing: "border-box",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                alignItems: "flex-start",
                "& .MuiAlert-message": {
                  minWidth: 0,
                  overflowWrap: "anywhere",
                },
                "& .MuiAlert-action": {
                  flexShrink: 0,
                  ml: 1,
                  mr: 0,
                },
              }}
            >
              <AlertTitle>{notificationContent?.title}</AlertTitle>
              {notificationContent?.message}
            </Alert>
          </Snackbar>
        )}
        onClose={closeSignIn}
        onSuccess={completeSignIn}
        open={isSignInOpen}
      />
    </>
  );
}
