"use client";

import { FormEvent, MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CloseRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Alert,
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
import {
  biometricAccessFeatureEnabled,
  BiometricLoginAction,
  getBiometricAccessIntegration,
  getBiometricAccessPreviewIntegration,
} from "@/features/biometric-access";

import {
  createLoginRequest,
  login,
  LoginServiceError,
} from "../login/services/login";
import type { LoginErrors } from "../login/types";
import { validateLogin } from "../login/validation";
import { SignInVisual } from "./SignInVisual";

type SignInSheetProps = Readonly<{
  notification?: ReactNode;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}>;

const INVALID_CREDENTIALS_MESSAGE =
  "El usuario o la contraseña son incorrectos. Verifica los datos e inténtalo nuevamente.";
const CONNECTION_ERROR_MESSAGE =
  "No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.";
const SERVICE_ERROR_MESSAGE =
  "No pudimos iniciar sesión en este momento. Inténtalo nuevamente más tarde.";

function BottomSheetTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function SignInSheet({ notification, open, onClose, onSuccess }: SignInSheetProps) {
  const biometricIntegration = getBiometricAccessIntegration()
    ?? getBiometricAccessPreviewIntegration();
  const showBiometricAccess = biometricAccessFeatureEnabled
    && biometricIntegration !== null;
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const submissionRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const cancelSubmission = () => {
    submissionRef.current = false;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  const resetForm = () => {
    cancelSubmission();
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setFormError("");
    setIsLoading(false);
  };

  const requestClose = () => {
    cancelSubmission();
    onClose();
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cancelSubmission();
    };
  }, []);

  useEffect(() => {
    if (formError) formErrorRef.current?.focus();
  }, [formError]);

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submissionRef.current) return;

    const data = { identifier, password };
    const nextErrors = validateLogin(data);

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

    const controller = new AbortController();
    submissionRef.current = true;
    abortControllerRef.current = controller;
    setIsLoading(true);

    try {
      await login(createLoginRequest(data), controller.signal);

      if (!isMountedRef.current) return;

      setPassword("");
      setShowPassword(false);
      onSuccess();
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error instanceof LoginServiceError && error.type === "aborted") {
        return;
      }

      if (error instanceof LoginServiceError && error.type === "invalidCredentials") {
        setFormError(INVALID_CREDENTIALS_MESSAGE);
      } else if (error instanceof LoginServiceError && error.type === "network") {
        setFormError(CONNECTION_ERROR_MESSAGE);
      } else {
        setFormError(SERVICE_ERROR_MESSAGE);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        submissionRef.current = false;
        abortControllerRef.current = null;
        if (isMountedRef.current) setIsLoading(false);
      }
    }
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
              md: "calc(100dvh - 32px)",
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
        aria-busy={isLoading}
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
            "@media (min-width: 900px) and (max-height: 820px)": {
              pt: 1.5,
              pb: 1,
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
              "@media (min-width: 900px) and (max-height: 820px)": { gap: 1.25 },
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
                "@media (min-width: 900px) and (max-height: 820px)": {
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

            {formError && (
              <Alert
                aria-live="assertive"
                ref={formErrorRef}
                role="alert"
                severity="error"
                tabIndex={-1}
                variant="standard"
                sx={(theme) => ({
                  boxSizing: "border-box",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: "text.primary",
                  alignItems: "flex-start",
                  "&:focus-visible": {
                    outline: `3px solid ${alpha(theme.palette.error.main, 0.45)}`,
                    outlineOffset: 2,
                  },
                })}
              >
                {formError}
              </Alert>
            )}

            <TextField
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              error={Boolean(errors.identifier)}
              fullWidth
              helperText={errors.identifier}
              id="sign-in-identifier"
              inputRef={identifierRef}
              label="Correo electrónico"
              name="identifier"
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((current) => ({ ...current, identifier: undefined }));
                setFormError("");
              }}
              required
              slotProps={{ htmlInput: { inputMode: "email" } }}
              type="email"
              value={identifier}
              variant="outlined"
              sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0 }}
            />

            <Stack spacing={0.5} sx={{ maxWidth: "100%", minWidth: 0 }}>
              <TextField
                autoComplete="current-password"
                disabled={isLoading}
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
                          disabled={isLoading}
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
              {showBiometricAccess && (
                <BiometricLoginAction
                  onAuthenticate={biometricIntegration.authenticate}
                />
              )}
            </Stack>

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
            "@media (min-width: 900px) and (max-height: 820px)": {
              pt: 1.25,
              pb: "calc(16px + env(safe-area-inset-bottom))",
            },
          }}
        >
          <Stack spacing={1.5}>
            <Button
              disabled={isLoading}
              fullWidth
              loading={isLoading}
              sx={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
              type="submit"
              variant="contained"
            >
              Ingresar
            </Button>
            <Button
              aria-disabled={isLoading}
              component={Link}
              disabled={isLoading}
              href="/recover-password"
              onClick={(event) => {
                if (isLoading) {
                  event.preventDefault();
                  return;
                }

                requestClose();
              }}
              variant="text"
              sx={{
                alignSelf: "center",
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
        </Box>
      </Box>
    </Dialog>
  );
}
