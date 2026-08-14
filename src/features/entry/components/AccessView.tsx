"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloseRounded } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { SignInSheet } from "@/features/auth";
import { themeTokens } from "@/theme/tokens";

import { AccessVisual } from "./AccessVisual";
import { BubbleField } from "./BubbleField";

type AccessViewProps = Readonly<{
  registrationSubmitted: boolean;
  onRegistrationSubmittedConsumed: () => void;
  onRepeatOnboarding: () => void;
}>;

export function AccessView({
  registrationSubmitted,
  onRegistrationSubmittedConsumed,
  onRepeatOnboarding,
}: AccessViewProps) {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRegistrationNoticeOpen, setIsRegistrationNoticeOpen] = useState(false);
  const registrationSubmissionHandledRef = useRef(false);

  useEffect(() => {
    if (!registrationSubmitted || registrationSubmissionHandledRef.current) return;

    registrationSubmissionHandledRef.current = true;
    setIsSignInOpen(true);
    setIsRegistrationNoticeOpen(true);
    onRegistrationSubmittedConsumed();
  }, [onRegistrationSubmittedConsumed, registrationSubmitted]);

  const repeatOnboarding = () => {
    setIsHelpOpen(false);
    onRepeatOnboarding();
  };

  const openSignIn = () => {
    setIsSignInOpen(true);
  };

  const closeSignIn = () => {
    setIsSignInOpen(false);
  };

  const completeSignIn = () => {
    router.replace("/home");
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
      >
        <DialogTitle id="help-dialog-title">Ayuda</DialogTitle>
        <DialogContent>
          <DialogContentText id="help-dialog-description">
            Puedes volver a consultar la introducción cuando lo necesites.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setIsHelpOpen(false)}>
            Cerrar
          </Button>
          <Button onClick={repeatOnboarding} variant="contained">
            Repetir onboarding
          </Button>
        </DialogActions>
      </Dialog>
      <SignInSheet onClose={closeSignIn} onSuccess={completeSignIn} open={isSignInOpen} />
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "top" }}
        autoHideDuration={9000}
        onClose={(_event, reason) => {
          if (reason !== "clickaway") setIsRegistrationNoticeOpen(false);
        }}
        open={isRegistrationNoticeOpen}
        sx={(theme) => ({
          top: "calc(16px + env(safe-area-inset-top)) !important",
          right: { xs: 2, sm: "auto" },
          left: { xs: 2, sm: "50%" },
          width: { xs: "auto", sm: "min(560px, calc(100% - 32px))" },
          transform: { xs: "none", sm: "translateX(-50%)" },
          zIndex: theme.zIndex.modal + 1,
        })}
      >
        <Alert
          action={
            <IconButton
              aria-label="Cerrar aviso de registro"
              color="inherit"
              onClick={() => setIsRegistrationNoticeOpen(false)}
              size="small"
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          }
          aria-live="polite"
          role="status"
          severity="success"
          sx={{ width: "100%", alignItems: "flex-start" }}
        >
          <AlertTitle>Registro procesado correctamente</AlertTitle>
          Revisa tu bandeja de entrada o correo no deseado y utiliza el enlace recibido para activar tu cuenta antes de iniciar sesión.
        </Alert>
      </Snackbar>
    </>
  );
}
