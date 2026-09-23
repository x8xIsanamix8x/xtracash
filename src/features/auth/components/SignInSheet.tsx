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
  DialogTitle,
  IconButton,
  InputAdornment,
  Slide,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { alpha, darken } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";
import {
  BiometricLoginAction,
  authenticateBiometricVault,
  type StartBiometricFlow,
} from "@/features/biometric-access";

import {
  createLoginRequest,
  login,
  LoginServiceError,
} from "../login/services/login";
import type { LoginErrors } from "../login/types";
import { validateLogin } from "../login/validation";
import { pillFieldSx } from "../shared/pillFieldSx";

type SignInSheetProps = Readonly<{
  biometricEnabled?: boolean;
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
  return <Slide {...props} direction={props.in ? "left" : "right"} />;
}

export function SignInSheet({ biometricEnabled = false, notification, open, onClose, onSuccess }: SignInSheetProps) {
  const showBiometricAccess = biometricEnabled;
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
  const biometricSubmissionRef = useRef(false);
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
    if (biometricSubmissionRef.current) return;
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

  const authenticateWithPasskey: StartBiometricFlow = async ({ signal }) => {
    if (submissionRef.current) throw new Error("authentication-busy");
    const controller = new AbortController();
    const combined = AbortSignal.any([signal, controller.signal]);
    abortControllerRef.current = controller;
    submissionRef.current = true;
    biometricSubmissionRef.current = true;
    setIsLoading(true);
    try {
      await authenticateBiometricVault(combined);
      if (isMountedRef.current && !combined.aborted) {
        setPassword("");
        setShowPassword(false);
        onSuccess();
      }
    }
    finally {
      submissionRef.current = false;
      biometricSubmissionRef.current = false;
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      if (isMountedRef.current) setIsLoading(false);
    }
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
            alignItems: "center",
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
              xs: "100dvh",
              md: "auto",
            },
            maxHeight: {
              xs: "100dvh",
              md: "calc(100dvh - 32px)",
            },
            borderRadius: { xs: 0, md: 3 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: themeTokens.color.preLoginBackground,
          },
        },
        transition: {
          onExited: resetForm,
        },
      }}
      transitionDuration={prefersReducedMotion ? 0 : { enter: 220, exit: 180 }}
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
            pt: "calc(12px + env(safe-area-inset-top))",
            pb: "calc(24px + env(safe-area-inset-bottom))",
            pr: "calc(19px + env(safe-area-inset-right))",
            pl: "calc(19px + env(safe-area-inset-left))",
          }}
        >
          <Stack
            spacing="19px"
            sx={{
              boxSizing: "border-box",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {notification}

            <Box
              sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                pt: "clamp(40px, 9dvh, 92px)",
                pb: "21px",
                "@media (max-height: 700px)": { pt: "44px", pb: 0 },
              }}
            >
              <IconButton
                aria-label="Cerrar inicio de sesión"
                onClick={requestClose}
                type="button"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  color: themeTokens.color.preLoginNavy,
                  "&:focus-visible": {
                    outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <CloseRounded />
              </IconButton>
              <Box
                alt=""
                aria-hidden="true"
                component="img"
                src="/entry/isotipo-impulsa.png"
                sx={{
                  display: "block",
                  width: 74,
                  height: "auto",
                  "@media (max-height: 700px)": { width: 48 },
                }}
              />
            </Box>

            <DialogTitle
              component="h2"
              id="sign-in-title"
              sx={{
                p: 0,
                pb: "17px",
                color: themeTokens.color.preLoginNavy,
                fontWeight: 600,
                fontSize: "clamp(2rem, 10vw, 2.5rem)",
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              Inicia sesión
            </DialogTitle>

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
              variant="filled"
              sx={pillFieldSx()}
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
                          sx={{ color: themeTokens.color.preLoginMuted }}
                        >
                          {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                type={showPassword ? "text" : "password"}
                value={password}
                variant="filled"
                sx={pillFieldSx()}
              />
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
                  alignSelf: "flex-end",
                  boxSizing: "border-box",
                  maxWidth: "100%",
                  minWidth: 0,
                  minHeight: 44,
                  px: 1,
                  color: themeTokens.color.preLoginNavy,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  "&:focus-visible": {
                    outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
                  },
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Stack>

            <Button
              disabled={isLoading}
              fullWidth
              loading={isLoading}
              sx={{
                boxSizing: "border-box",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                minHeight: 50,
                // Stack spacing sets margin-top on children; "&&" wins so the Figma gap applies.
                "&&": { mt: "clamp(19px, 8dvh, 75px)" },
                borderRadius: "999px",
                fontWeight: 400,
                bgcolor: themeTokens.color.preLoginPrimary,
                "&:hover": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.12) },
                "&:active": { bgcolor: darken(themeTokens.color.preLoginPrimary, 0.2) },
                "&:focus-visible": {
                  outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
                  outlineOffset: 2,
                },
              }}
              type="submit"
              variant="contained"
            >
              Ingresar
            </Button>

            <Box sx={{ pt: "clamp(8px, 3dvh, 28px)" }}>
              {showBiometricAccess && (
                <BiometricLoginAction
                  disabled={isLoading}
                  onAuthenticate={authenticateWithPasskey}
                />
              )}
              {!showBiometricAccess && (
                <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", opacity: 0.6 }}>
                  <Box
                    alt=""
                    aria-hidden="true"
                    component="img"
                    src="/entry/face-scan.svg"
                    sx={{ display: "block", width: 40, height: 40 }}
                  />
                  <Typography sx={{ maxWidth: 320, color: themeTokens.color.preLoginMuted, fontSize: "0.8125rem" }}>
                    Ingresa con tu usuario y contraseña. Activa tu biometría desde tu Perfil para acceder más rápido.
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
