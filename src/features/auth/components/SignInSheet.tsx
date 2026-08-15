"use client";

import { FormEvent, MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CloseRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Slide,
  Stack,
  TextField,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

import { SignInVisual } from "./SignInVisual";

type SignInSheetProps = Readonly<{
  notification?: ReactNode;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}>;

type FieldErrors = Readonly<{
  identifier?: string;
  password?: string;
}>;

const INVALID_CREDENTIALS_MESSAGE =
  "El usuario o la contraseña son incorrectos. Verifica los datos e inténtalo nuevamente.";

function BottomSheetTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function SignInSheet({ notification, open, onClose, onSuccess }: SignInSheetProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const submissionRef = useRef(0);

  const cancelSimulation = () => {
    submissionRef.current += 1;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetForm = () => {
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setFormError("");
    setIsLoading(false);
  };

  const requestClose = () => {
    cancelSimulation();
    onClose();
  };

  useEffect(() => {
    return () => cancelSimulation();
  }, []);

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const nextErrors: FieldErrors = {
      ...(identifier.trim() ? {} : { identifier: "Ingresa tu usuario o correo electrónico." }),
      ...(password.trim() ? {} : { password: "Ingresa tu contraseña." }),
    };

    setErrors(nextErrors);
    setFormError("");
    if (nextErrors.identifier) {
      identifierRef.current?.focus();
      return;
    }

    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    setIsLoading(true);
    const submission = submissionRef.current + 1;
    submissionRef.current = submission;
    timerRef.current = window.setTimeout(() => {
      if (submissionRef.current !== submission) {
        return;
      }

      timerRef.current = null;
      setIsLoading(false);

      if (identifier.trim().toLowerCase() === "invalido") {
        setFormError(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      onSuccess();
    }, 600);
  };

  const keepPasswordFocus = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Dialog
      aria-describedby="sign-in-description"
      aria-labelledby="sign-in-title"
      fullWidth
      maxWidth={false}
      onClose={requestClose}
      open={open}
      scroll="paper"
      slots={{ transition: BottomSheetTransition }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "secondary.main", opacity: 0.78 },
        },
        container: {
          sx: {
            minWidth: 0,
            maxWidth: "100%",
            alignItems: { xs: "flex-end", md: "center" },
            overflowX: "hidden",
          },
        },
        paper: {
          sx: {
            boxSizing: "border-box",
            m: { xs: 0, md: 2 },
            width: "100%",
            minWidth: 0,
            maxWidth: { xs: "100%", md: "min(520px, calc(100% - 32px))" },
            height: {
              xs: "85dvh",
              md: "auto",
            },
            maxHeight: {
              xs: "calc(100dvh - 16px - env(safe-area-inset-top))",
              md: "80dvh",
            },
            borderRadius: { xs: "24px 24px 0 0", md: 3 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
        transition: {
          onExited: resetForm,
        },
      }}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
    >
      <Box
        component="form"
        noValidate
        onSubmit={submitForm}
        sx={{
          position: "relative",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          minHeight: 0,
          height: { xs: "100%", md: "auto" },
          maxHeight: "100%",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          overflowX: "hidden",
        }}
      >
        <DialogContent
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            display: "flex",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            overflowX: "hidden",
            overflowY: "auto",
            pb: { xs: 1.5, sm: 2 },
            pr: {
              xs: "calc(16px + env(safe-area-inset-right))",
              sm: "calc(24px + env(safe-area-inset-right))",
            },
            pl: {
              xs: "calc(16px + env(safe-area-inset-left))",
              sm: "calc(24px + env(safe-area-inset-left))",
            },
          }}
        >
          <Stack
            spacing={2}
            sx={{
              boxSizing: "border-box",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              "@media (max-height: 700px)": { gap: 1.5 },
            }}
          >
            {notification}

            <Box
              sx={{
                position: "relative",
                boxSizing: "border-box",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                mb: 2,
                "@media (max-height: 700px)": {
                  mb: 0,
                },
                "@media (max-height: 450px)": {
                  minHeight: 52,
                },
              }}
            >
              <SignInVisual />
              <IconButton
                aria-label="Cerrar inicio de sesión"
                onClick={requestClose}
                type="button"
                sx={(theme) => ({
                  position: "absolute",
                  top: 14,
                  right: 14,
                  zIndex: 2,
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.common.white,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.common.white, 0.3),
                  boxShadow: `0 6px 18px ${alpha(theme.palette.secondary.main, 0.42)}`,
                  "@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))": {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.48),
                    backdropFilter: "blur(12px) saturate(140%)",
                    WebkitBackdropFilter: "blur(12px) saturate(140%)",
                  },
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.62),
                  },
                  "&:active": {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.72),
                  },
                  "&:focus-visible": {
                    outline: `3px solid ${themeTokens.color.brandLogo}`,
                    outlineOffset: 2,
                  },
                  "@media (prefers-reduced-transparency: reduce)": {
                    backgroundColor: theme.palette.secondary.main,
                    backdropFilter: "none",
                    WebkitBackdropFilter: "none",
                  },
                })}
              >
                <CloseRounded />
              </IconButton>
            </Box>

            <Stack spacing={1.5} sx={{ maxWidth: "100%", minWidth: 0 }}>
              <DialogTitle
                component="h2"
                id="sign-in-title"
                sx={{
                  p: 0,
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "1.625rem" },
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  textAlign: "left",
                }}
              >
                Inicia sesión
              </DialogTitle>

              <DialogContentText id="sign-in-description" sx={{ textAlign: "left" }}>
                Ingresa tus datos para continuar.
              </DialogContentText>
            </Stack>

            <TextField
              autoComplete="username"
              autoFocus
              error={Boolean(errors.identifier)}
              fullWidth
              helperText={errors.identifier}
              id="sign-in-identifier"
              inputRef={identifierRef}
              label="Usuario o correo electrónico"
              name="identifier"
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((current) => ({ ...current, identifier: undefined }));
                setFormError("");
              }}
              required
              type="text"
              value={identifier}
              variant="outlined"
              sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0 }}
            />

            <Stack spacing={0.5} sx={{ maxWidth: "100%", minWidth: 0 }}>
              <TextField
                autoComplete="current-password"
                error={Boolean(errors.password)}
                fullWidth
                helperText={errors.password}
                id="sign-in-password"
                inputRef={passwordRef}
                label="Contraseña"
                name="password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                  setFormError("");
                }}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((current) => !current)}
                          onMouseDown={keepPasswordFocus}
                          type="button"
                          sx={{ color: themeTokens.color.brandLogo }}
                        >
                          {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                type={showPassword ? "text" : "password"}
                value={password}
                variant="outlined"
                sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0 }}
              />
              <Button
                component={Link}
                href="/recover-password"
                onClick={requestClose}
                variant="text"
                sx={{
                  alignSelf: "flex-end",
                  boxSizing: "border-box",
                  maxWidth: "100%",
                  minWidth: 0,
                  minHeight: 44,
                  color: themeTokens.color.brandLogo,
                  "&:focus-visible": {
                    outlineColor: themeTokens.color.focus,
                  },
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Stack>

            {formError && (
              <DialogContentText color="error" role="alert">
                {formError}
              </DialogContentText>
            )}
          </Stack>
        </DialogContent>

        <Box
          component="footer"
          sx={{
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            flexShrink: 0,
            bgcolor: "background.paper",
            pt: { xs: 1.5, sm: 2 },
            pr: {
              xs: "calc(16px + env(safe-area-inset-right))",
              sm: "calc(24px + env(safe-area-inset-right))",
            },
            pb: {
              xs: "calc(16px + env(safe-area-inset-bottom))",
              sm: "calc(24px + env(safe-area-inset-bottom))",
            },
            pl: {
              xs: "calc(16px + env(safe-area-inset-left))",
              sm: "calc(24px + env(safe-area-inset-left))",
            },
          }}
        >
          <Button
            fullWidth
            loading={isLoading}
            sx={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
            type="submit"
            variant="contained"
          >
            Ingresar
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
