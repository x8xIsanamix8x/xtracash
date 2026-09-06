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
          position: "relative",
          isolation: "isolate",
          minHeight: "100dvh",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "background.default",
          backgroundImage: "url('/entry/login-background.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
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
            sx={{ color: "secondary.main" }}
          >
            <HelpOutlineRounded />
          </IconButton>
        </Stack>

        <Stack
          spacing={1.5}
          sx={{
            alignItems: "center",
            textAlign: "center",
            pt: { xs: "clamp(80px, 16dvh, 164px)", sm: 10 },
            px: 3,
          }}
        >
          <Box
            alt="Impúlsate Móvil"
            component="img"
            src="/entry/isopulsa.png"
            sx={{
              width: "clamp(142px, 37vw, 164px)",
              height: "auto",
              display: "block",
              "@media (min-width: 414px)": {
                width: "clamp(164px, 43vw, 242px)",
              },
            }}
          />
          <Typography
            component="h1"
            sx={{
              color: themeTokens.color.brandLogo,
              fontSize: { xs: "1.75rem", sm: "2.15rem" },
              fontWeight: 800,
              letterSpacing: "0.02em",
            }}
          >
            IMPÚLSATE MÓVIL
          </Typography>
        </Stack>

        <Stack
          spacing={1.5}
          sx={{
            width: "100%",
            maxWidth: 520,
            mx: "auto",
            mt: "auto",
            pt: 3,
            pr: "calc(24px + env(safe-area-inset-right))",
            pb: "max(8px, env(safe-area-inset-bottom))",
            pl: "calc(24px + env(safe-area-inset-left))",
            "@media (max-height: 650px)": {
              gap: 1,
              pt: 2,
              pb: "calc(16px + env(safe-area-inset-bottom))",
            },
          }}
        >
          <Button fullWidth onClick={openSignIn} variant="contained">
            Iniciar sesión
          </Button>
          <Button
            fullWidth
            color="secondary"
            component={Link}
            href="/register"
            variant="outlined"
            sx={{
              bgcolor: "background.paper",
              "&:hover": { borderColor: "primary.main", bgcolor: "background.paper" },
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
