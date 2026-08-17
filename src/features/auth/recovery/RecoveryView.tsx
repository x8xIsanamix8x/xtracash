"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBackRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { recoveryRequestedUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import { RecoveryRequestStep } from "./components/RecoveryRequestStep";
import { RecoveryStepVisual } from "./components/RecoveryStepVisual";
import {
  clearRecoveryCooldown,
  formatRecoveryCooldownTime,
  getRecoveryCooldownRemainingSeconds,
  getRecoveryCooldownUntil,
  startRecoveryCooldown,
} from "./lib/recoveryCooldown";
import {
  createRecoveryRequest,
  requestPasswordRecovery,
  RecoveryServiceError,
} from "./services/recovery";
import type { RecoveryData } from "./types";
import { validateRecoveryIdentifier } from "./validation";

const initialData: RecoveryData = {
  identifier: "",
};

function getRecoveryErrorMessage(error: unknown): string {
  if (!(error instanceof RecoveryServiceError)) {
    return "No pudimos procesar la solicitud. Inténtalo nuevamente.";
  }

  if (error.type === "network") {
    return "No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.";
  }

  if (error.type === "http") {
    return "No pudimos procesar la solicitud. Inténtalo nuevamente más tarde.";
  }

  return "La recuperación no está disponible en este momento. Inténtalo nuevamente más tarde.";
}

export function RecoveryView() {
  const router = useRouter();
  const [data, setData] = useState<RecoveryData>(initialData);
  const [fieldError, setFieldError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const submissionRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownUntilRef = useRef<number | null>(null);
  const cooldownIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    titleRef.current?.focus();

    const stopCooldownTicker = () => {
      if (cooldownIntervalRef.current === null) return;

      window.clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    };

    const updateCooldown = () => {
      const cooldownUntil = cooldownUntilRef.current;
      if (cooldownUntil === null) {
        setCooldownSecondsRemaining(0);
        return;
      }

      const remainingSeconds = getRecoveryCooldownRemainingSeconds(cooldownUntil);
      setCooldownSecondsRemaining(remainingSeconds);

      if (remainingSeconds === 0) {
        cooldownUntilRef.current = null;
        clearRecoveryCooldown();
        stopCooldownTicker();
      }
    };

    const initializationTimeout = window.setTimeout(() => {
      cooldownUntilRef.current = getRecoveryCooldownUntil();
      updateCooldown();

      if (cooldownUntilRef.current !== null) {
        cooldownIntervalRef.current = window.setInterval(updateCooldown, 1000);
      }
    }, 0);

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      window.clearTimeout(initializationTimeout);
      stopCooldownTicker();
    };
  }, []);

  const isCooldownChecking = cooldownSecondsRemaining === null;
  const isCooldownActive = (cooldownSecondsRemaining ?? 0) > 0;

  const updateIdentifier = (value: string) => {
    if (isSubmitting) return;

    setData({ identifier: value });
    setFieldError("");
    setRequestError("");
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submissionRef.current || isCooldownChecking || isCooldownActive) return;

    const nextFieldError = validateRecoveryIdentifier(data.identifier);
    setFieldError(nextFieldError);
    setRequestError("");

    if (nextFieldError) {
      identifierRef.current?.focus();
      return;
    }

    const request = createRecoveryRequest(data.identifier);
    const controller = new AbortController();
    submissionRef.current = true;
    abortControllerRef.current = controller;
    setIsSubmitting(true);

    try {
      await requestPasswordRecovery(request, controller.signal);

      startRecoveryCooldown();

      if (!isMountedRef.current) return;

      setData(initialData);
      setFieldError("");
      setRequestError("");
      router.replace(recoveryRequestedUrl);
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error instanceof RecoveryServiceError && error.type === "aborted") {
        return;
      }

      setRequestError(getRecoveryErrorMessage(error));
    } finally {
      submissionRef.current = false;
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Container
        maxWidth={false}
        sx={{
          width: "100%",
          maxWidth: 1120,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          pt: "calc(16px + env(safe-area-inset-top))",
          pr: "calc(16px + env(safe-area-inset-right))",
          pb: "calc(16px + env(safe-area-inset-bottom))",
          pl: "calc(16px + env(safe-area-inset-left))",
        }}
      >
        <Stack direction="row" sx={{ minHeight: 48, alignItems: "center", justifyContent: "space-between" }}>
          <IconButton aria-label="Volver a la pantalla de acceso" component={Link} href="/">
            <ArrowBackRounded />
          </IconButton>
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800 }}>
            Impúlsate Móvil
          </Typography>
        </Stack>

        <Box sx={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", py: { xs: 2, sm: 4 } }}>
          <Paper
            variant="outlined"
            sx={{
              flex: "1 0 auto",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 38fr) minmax(0, 62fr)" },
              gridTemplateRows: { xs: "auto minmax(min-content, 1fr)", lg: "minmax(min-content, 1fr)" },
              minHeight: { sm: 520, lg: 520 },
              my: { xs: 0, sm: "auto" },
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                minWidth: 0,
                overflow: "hidden",
                bgcolor: "background.default",
                borderBottom: { xs: "1px solid", lg: 0 },
                borderRight: { xs: 0, lg: "1px solid" },
                borderColor: "divider",
              }}
            >
              <RecoveryStepVisual />
            </Box>
            <Box
              sx={{
                display: "flex",
                width: "100%",
                maxWidth: { xs: 680, lg: "none" },
                minWidth: 0,
                mx: "auto",
                flexDirection: "column",
                justifyContent: "center",
                p: { xs: 2, sm: 3, lg: 4 },
              }}
            >
              <Stack spacing={1}>
                <Typography
                  component="h1"
                  ref={titleRef}
                  tabIndex={-1}
                  variant="h4"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Recupera tu acceso
                </Typography>
                <Typography color="text.secondary">
                  Ingresa el correo electrónico asociado a tu cuenta para recibir las instrucciones de recuperación.
                </Typography>
              </Stack>

              <Box
                aria-busy={isSubmitting || isCooldownChecking}
                component="form"
                noValidate
                onSubmit={submitRequest}
                sx={{ display: "flex", flexDirection: "column", pt: 3 }}
              >
                <RecoveryRequestStep
                  disabled={isSubmitting}
                  error={fieldError}
                  identifier={data.identifier}
                  inputRef={identifierRef}
                  onChange={updateIdentifier}
                />

                {requestError && (
                  <Alert role="alert" severity="error" sx={{ mt: 2 }}>
                    {requestError}
                  </Alert>
                )}

                {cooldownSecondsRemaining !== null && cooldownSecondsRemaining > 0 && (
                  <Typography aria-live="polite" role="status" sx={{ mt: 2, color: "text.secondary" }}>
                    Podrás solicitar otro enlace en {formatRecoveryCooldownTime(cooldownSecondsRemaining)}
                  </Typography>
                )}

                <Button
                  disabled={isSubmitting || isCooldownChecking || isCooldownActive}
                  fullWidth
                  loading={isSubmitting}
                  sx={{ mt: 3 }}
                  type="submit"
                  variant="contained"
                >
                  Enviar enlace
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
