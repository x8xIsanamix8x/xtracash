"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { SignInSheet } from "@/features/auth";
import { themeTokens } from "@/theme/tokens";

import { AccessVisual } from "./AccessVisual";
import { BubbleField } from "./BubbleField";

type PrototypeNotice = "register" | null;

type AccessViewProps = Readonly<{
  onRepeatOnboarding: () => void;
}>;

const prototypeMessages = {
  register: "El registro estará disponible en la siguiente etapa.",
} as const;

export function AccessView({ onRepeatOnboarding }: AccessViewProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<PrototypeNotice>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const repeatOnboarding = () => {
    setIsHelpOpen(false);
    onRepeatOnboarding();
  };

  const openSignIn = () => {
    setNotice(null);
    setIsSignInOpen(true);
  };

  const closeSignIn = () => {
    setNotice(null);
    setIsSignInOpen(false);
  };

  const completeSignIn = () => {
    router.replace("/home");
  };

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        isolation: "isolate",
        minHeight: "100dvh",
        height: "100dvh",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        overflow: "hidden",
        bgcolor: "secondary.main",
        color: "secondary.contrastText",
        pt: "calc(16px + env(safe-area-inset-top))",
        pr: "calc(24px + env(safe-area-inset-right))",
        pb: "calc(12px + env(safe-area-inset-bottom))",
        pl: "calc(24px + env(safe-area-inset-left))",
      }}
    >
      <BubbleField variant="dark" />

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
          variant="h5"
          sx={{ color: themeTokens.color.brandLogo, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          xtracash
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
          position: "relative",
          zIndex: 1,
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          overflowY: "auto",
          py: 1,
        }}
      >
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 620, alignItems: "center", textAlign: "center" }}>
          <Box
            sx={{
              "@media (max-height: 650px)": { "& > *": { maxWidth: 152 } },
              "@media (max-height: 500px)": { display: "none" },
            }}
          >
            <AccessVisual />
          </Box>
          <Typography component="h1" variant="h2" sx={{ fontSize: { xs: "2.35rem", md: "3.5rem" } }}>
            Tu crédito, más simple.
          </Typography>
          <Typography color="secondary.contrastText" sx={{ maxWidth: 480, fontSize: "1.125rem", opacity: 0.82 }}>
            Solicita y consulta el avance desde un solo lugar.
          </Typography>
        </Stack>
      </Box>

      <Stack
        spacing={1.5}
        sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, mx: "auto", pt: 2 }}
      >
        {notice && (
          <Alert aria-live="polite" role="status" severity="info">
            {prototypeMessages[notice]}
          </Alert>
        )}
        <Button
          fullWidth
          onClick={openSignIn}
          variant="contained"
          sx={{ "&:focus-visible": { outlineColor: "common.white" } }}
        >
          Ingresar
        </Button>
        <Button
          fullWidth
          color="inherit"
          onClick={() => setNotice("register")}
          variant="outlined"
          sx={{
            borderColor: "secondary.contrastText",
            "&:hover": { borderColor: "secondary.contrastText", bgcolor: "secondary.light" },
            "&:focus-visible": { outlineColor: "common.white" },
          }}
        >
          Registrarme
        </Button>
      </Stack>

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
    </Box>
  );
}
