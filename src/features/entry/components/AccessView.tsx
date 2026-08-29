"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloseRounded, EmailOutlined } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { SignInSheet } from "@/features/auth";
import { PUBLIC_RECOVERY_SUCCESS_MESSAGE } from "@/features/auth/recovery/presentation";
import type {
  AccessNavigationRequest,
  AccessNotification,
} from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import { AccessVisual } from "./AccessVisual";
import { BubbleField } from "./BubbleField";
import { TEMPORARY_SUPPORT_EMAIL } from "../data/supportContact";

type AccessViewProps = Readonly<{
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
  accessRequest,
  onAccessRequestConsumed,
}: AccessViewProps) {
  const router = useRouter();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [visibleAccessNotification, setVisibleAccessNotification] =
    useState<AccessNotification | null>(null);
  const [isAccessNotificationOpen, setIsAccessNotificationOpen] = useState(false);
  const accessNotificationHandledRef = useRef(false);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);

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
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          width: "100%",
          height: "clamp(248px, 50dvh, 500px)",
          color: "secondary.contrastText",
          borderRadius: "0 0 28px 28px",
          pt: "calc(16px + env(safe-area-inset-top))",
          pr: "calc(24px + env(safe-area-inset-right))",
          pl: "calc(24px + env(safe-area-inset-left))",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: "inherit",
            bgcolor: "secondary.main",
          }}
        >
          <BubbleField variant="dark" />
        </Box>

        <Stack
          direction="row"
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 720,
            mx: "auto",
            minHeight: 48,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            noWrap
            variant="h5"
            sx={{
              color: themeTokens.color.brandLogo,
              fontSize: { xs: "1.125rem", sm: "1.5rem" },
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Impúlsate Móvil
          </Typography>
          <Button
            color="inherit"
            onClick={() => setIsHelpOpen(true)}
            ref={helpTriggerRef}
            variant="text"
            sx={{ "&:focus-visible": { outlineColor: "common.white" } }}
          >
            Ayuda
          </Button>
        </Stack>

        <Box
          sx={{
            position: "absolute",
            zIndex: 2,
            left: "50%",
            bottom: 0,
            transform: "translate(-50%, 24%)",
            "@media (max-height: 650px)": { "& > *": { maxWidth: 140 } },
            "@media (max-height: 520px)": { "& > *": { maxWidth: 112 } },
          }}
        >
          <AccessVisual />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 720,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          pt: { xs: 8, md: 10 },
          pr: "calc(24px + env(safe-area-inset-right))",
          pb: 0,
          pl: "calc(24px + env(safe-area-inset-left))",
          "@media (max-height: 650px)": { pt: 4 },
          "@media (max-height: 520px)": { pt: 3 },
        }}
      >
        <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography
            component="h1"
            variant="h2"
            sx={{
              color: "secondary.main",
              fontSize: { xs: "clamp(2rem, 9vw, 2.35rem)", md: "3.5rem" },
            }}
          >
            Tu crédito, más simple.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 480, fontSize: { xs: "1rem", sm: "1.125rem" } }}
          >
            Solicita y consulta el avance desde un solo lugar.
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
            pb: {
              xs: "calc(28px + env(safe-area-inset-bottom))",
              sm: "calc(36px + env(safe-area-inset-bottom))",
            },
            "@media (max-height: 650px)": { gap: 1, pt: 2 },
          }}
        >
          <Button fullWidth onClick={openSignIn} variant="contained">
            Ingresar
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

      </Box>

      <Dialog
        aria-describedby="help-dialog-description"
        aria-labelledby="help-dialog-title"
        fullWidth
        maxWidth="xs"
        onClose={() => setIsHelpOpen(false)}
        open={isHelpOpen}
        slotProps={{
          paper: {
            sx: {
              position: "relative",
              m: 2,
              width: "calc(100% - 32px)",
              maxHeight: "calc(100dvh - 32px)",
              borderRadius: 3,
              overflow: "hidden",
            },
          },
          transition: {
            onExited: () => helpTriggerRef.current?.focus({ preventScroll: true }),
          },
        }}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
      >
        <IconButton
          aria-label="Cerrar ayuda"
          onClick={() => setIsHelpOpen(false)}
          sx={{
            position: "absolute",
            zIndex: 1,
            top: 8,
            right: 8,
            minWidth: 44,
            minHeight: 44,
            color: "secondary.main",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "action.hover" },
          }}
          type="button"
        >
          <CloseRounded />
        </IconButton>

        <DialogTitle component="div" sx={{ px: 3, pt: 4.5, pb: 1 }}>
          <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center" }}>
            <Box
              sx={(theme) => ({
                width: 64,
                height: 64,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: themeTokens.color.accent,
                bgcolor: alpha(themeTokens.color.accent, 0.12),
                border: `1px solid ${alpha(themeTokens.color.accent, 0.2)}`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`,
              })}
            >
              <EmailOutlined aria-hidden="true" sx={{ width: 32, height: 32 }} />
            </Box>
            <Typography
              component="h2"
              id="help-dialog-title"
              variant="h5"
              sx={{ color: "secondary.main", fontWeight: 700 }}
            >
              Contacta con soporte
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 3, sm: 4 },
            pb: "calc(24px + env(safe-area-inset-bottom))",
            textAlign: "center",
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography color="text.secondary" id="help-dialog-description">
              Si necesitas ayuda, escríbenos a:
            </Typography>
            <Typography
              sx={{
                maxWidth: "100%",
                color: "text.primary",
                fontWeight: 700,
                overflowWrap: "anywhere",
              }}
            >
              {TEMPORARY_SUPPORT_EMAIL}
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
      <SignInSheet
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
