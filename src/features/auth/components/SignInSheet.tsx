"use client";

import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
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

export function SignInSheet({ open, onClose, onSuccess }: SignInSheetProps) {
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
          sx: { alignItems: { xs: "flex-end", md: "center" } },
        },
        paper: {
          sx: {
            m: { xs: 0, md: 2 },
            width: "100%",
            maxWidth: { xs: "100%", md: 520 },
            height: {
              xs: "min(82dvh, 720px)",
              md: "auto",
            },
            maxHeight: {
              xs: "min(82dvh, 720px)",
              md: "80dvh",
            },
            borderRadius: { xs: "24px 24px 0 0", md: 3 },
            "@media (max-height: 650px) and (max-width: 899.95px)": {
              height: "calc(100dvh - 48px - env(safe-area-inset-top))",
              maxHeight: "calc(100dvh - 48px - env(safe-area-inset-top))",
            },
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
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <DialogContent
          sx={{
            minHeight: 0,
            flex: 1,
            display: "flex",
            overflowY: "auto",
            pt: { xs: 2, md: 2.5 },
            pb: {
              xs: "calc(16px + env(safe-area-inset-bottom))",
              md: "calc(24px + env(safe-area-inset-bottom))",
            },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack
            spacing={{ xs: 1.75, md: 2.5 }}
            sx={{ width: "100%", minHeight: "100%" }}
            useFlexGap
          >
            <Box
              sx={{
                position: "relative",
                mb: { xs: 0.5, md: 2 },
                "@media (max-height: 650px)": {
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

            <Stack spacing={{ xs: 1, md: 1.5 }}>
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
            />

            <Stack spacing={0.5}>
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
              />
              <Button
                component={Link}
                href="/recover-password"
                onClick={requestClose}
                variant="text"
                sx={{
                  alignSelf: "flex-end",
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

            <Box sx={{ minHeight: 24 }}>
              {formError && (
                <DialogContentText color="error" role="alert">
                  {formError}
                </DialogContentText>
              )}
            </Box>

            <Box sx={{ mt: "auto", pt: { xs: 1, md: 0 } }}>
              <Button fullWidth loading={isLoading} type="submit" variant="contained">
                Ingresar
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
