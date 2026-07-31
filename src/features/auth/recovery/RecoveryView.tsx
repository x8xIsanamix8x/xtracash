"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowBackRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import { RecoveryCodeStep } from "./components/RecoveryCodeStep";
import { RecoveryPasswordStep } from "./components/RecoveryPasswordStep";
import { RecoveryRequestStep } from "./components/RecoveryRequestStep";
import {
  RecoveryStepVisual,
  type RecoveryVisualKey,
} from "./components/RecoveryStepVisual";
import { recoveryMock } from "./mocks/recovery";
import type {
  RecoveryData,
  RecoveryErrors,
  RecoveryField,
  RecoveryStep,
} from "./types";
import {
  validateRecoveryCode,
  validateRecoveryIdentifier,
  validateRecoveryPassword,
} from "./validation";

const initialData: RecoveryData = {
  identifier: "",
  password: "",
  passwordConfirmation: "",
};

const requestStatusMessage =
  "Si los datos coinciden con una cuenta registrada, recibirás un código de validación.";

const stepContent: readonly Readonly<{
  title: string;
  description: string;
  visualKey: RecoveryVisualKey;
}>[] = [
  {
    title: "Recupera tu acceso",
    description: "Ingresa el correo o teléfono asociado a tu cuenta para continuar.",
    visualKey: "request",
  },
  {
    title: "Confirma que eres tú",
    description: "Ingresa el código de 6 dígitos enviado a tu medio de contacto.",
    visualKey: "code",
  },
  {
    title: "Crea una nueva contraseña",
    description: "",
    visualKey: "password",
  },
];

function maskIdentifier(identifier: string) {
  const value = identifier.trim();

  if (!value.includes("@")) {
    return `Teléfono ••••••• ${value.slice(-4)}`;
  }

  const [localPart, domain = ""] = value.split("@");
  const domainParts = domain.split(".");
  const domainName = domainParts[0] ?? "";
  const extension = domainParts.at(-1);
  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  const visibleDomain = domainName.slice(0, 1);

  return `Correo ${visibleLocal}•••@${visibleDomain}•••${extension ? `.${extension}` : ""}`;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `El código vence en ${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function RecoveryView() {
  const [step, setStep] = useState<RecoveryStep>(0);
  const [data, setData] = useState<RecoveryData>(initialData);
  const [errors, setErrors] = useState<RecoveryErrors>({});
  const [requestError, setRequestError] = useState("");
  const [requestGeneralError, setRequestGeneralError] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(recoveryMock.maximumAttempts);
  const [isCodeUnavailable, setIsCodeUnavailable] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(recoveryMock.codeLifetimeSeconds);
  const [resendMessage, setResendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const simulationTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const expiresAtRef = useRef<number | null>(null);
  const operationRef = useRef(0);

  const clearSimulation = () => {
    operationRef.current += 1;

    if (simulationTimerRef.current !== null) {
      window.clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    setIsLoading(false);
  };

  const clearCountdown = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const expireCode = () => {
    clearCountdown();
    setSecondsRemaining(0);
    setIsCodeUnavailable(true);
    setCodeError("El código venció. Solicita uno nuevo.");
  };

  const startCountdown = (expiresAt = Date.now() + recoveryMock.codeLifetimeSeconds * 1000) => {
    clearCountdown();
    expiresAtRef.current = expiresAt;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        expireCode();
      }
    };

    updateCountdown();
    if (expiresAt > Date.now()) {
      countdownTimerRef.current = window.setInterval(updateCountdown, 1000);
    }
  };

  const resetCodeSession = () => {
    setCode("");
    setCodeError("");
    setAttemptsRemaining(recoveryMock.maximumAttempts);
    setIsCodeUnavailable(false);
    setResendMessage("");
    startCountdown();
  };

  useEffect(() => {
    titleRef.current?.focus();
  }, [step, isComplete]);

  useEffect(() => {
    return () => {
      operationRef.current += 1;
      if (simulationTimerRef.current !== null) window.clearTimeout(simulationTimerRef.current);
      if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current);
    };
  }, []);

  const updateData = (field: RecoveryField, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));

    if (field === "identifier") {
      setRequestError("");
      setRequestGeneralError("");
      setRequestStatus("");
    }

    if (field === "password" && data.passwordConfirmation) {
      setErrors((current) => ({
        ...current,
        passwordConfirmation:
          data.passwordConfirmation === value ? undefined : "Las contraseñas no coinciden.",
      }));
    }
  };

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const identifierError = validateRecoveryIdentifier(data.identifier);
    setRequestError(identifierError);
    setRequestGeneralError("");
    setRequestStatus("");

    if (identifierError) {
      identifierRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setRequestStatus(requestStatusMessage);
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    simulationTimerRef.current = window.setTimeout(() => {
      if (operationRef.current !== operation) return;

      simulationTimerRef.current = null;
      setIsLoading(false);

      if (data.identifier.trim().toLowerCase() === recoveryMock.requestErrorIdentifier) {
        setRequestStatus("");
        setRequestGeneralError("No pudimos procesar la solicitud. Inténtalo nuevamente.");
        return;
      }

      resetCodeSession();
      setStep(1);
    }, recoveryMock.simulationDelay);
  };

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCodeUnavailable) return;

    if (expiresAtRef.current === null || expiresAtRef.current <= Date.now()) {
      expireCode();
      return;
    }

    const formatError = validateRecoveryCode(code);
    if (formatError) {
      setCodeError(formatError);
      codeRef.current?.focus();
      return;
    }

    if (code !== recoveryMock.validCode) {
      const nextAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(nextAttempts);

      if (nextAttempts === 0) {
        clearCountdown();
        setIsCodeUnavailable(true);
        setCodeError("Alcanzaste el número máximo de intentos. Solicita un nuevo código.");
      } else {
        setCodeError(`El código es incorrecto. Te quedan ${nextAttempts} intentos.`);
      }
      codeRef.current?.focus();
      return;
    }

    clearCountdown();
    setCodeError("");
    setStep(2);
  };

  const resendCode = () => {
    resetCodeSession();
    setResendMessage("Código reenviado de forma demostrativa.");
    window.setTimeout(() => codeRef.current?.focus(), 0);
  };

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const nextErrors = validateRecoveryPassword(data);
    setErrors(nextErrors);

    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    if (nextErrors.passwordConfirmation) {
      confirmationRef.current?.focus();
      return;
    }

    setIsLoading(true);
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    simulationTimerRef.current = window.setTimeout(() => {
      if (operationRef.current !== operation) return;

      simulationTimerRef.current = null;
      setIsLoading(false);
      setData(initialData);
      setCode("");
      setIsComplete(true);
    }, recoveryMock.simulationDelay);
  };

  const goBack = () => {
    clearSimulation();
    setErrors({});

    if (step === 1) {
      clearCountdown();
      expiresAtRef.current = null;
      setCode("");
      setCodeError("");
      setResendMessage("");
      setStep(0);
      return;
    }

    const expiresAt = expiresAtRef.current;
    setStep(1);
    setCodeError("");

    if (expiresAt === null || expiresAt <= Date.now()) {
      expireCode();
      return;
    }

    setIsCodeUnavailable(false);
    startCountdown(expiresAt);
  };

  const currentContent = stepContent[step];
  const destinationLabel = maskIdentifier(data.identifier);
  const countdownLabel = secondsRemaining === 0
    ? "El código ya no está vigente"
    : formatCountdown(secondsRemaining);

  if (isComplete) {
    return (
      <Box component="main" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: "background.default" }}>
        <Container
          maxWidth={false}
          sx={{
            width: "100%",
            maxWidth: 1120,
            pt: "calc(24px + env(safe-area-inset-top))",
            pr: "calc(16px + env(safe-area-inset-right))",
            pb: "calc(24px + env(safe-area-inset-bottom))",
            pl: "calc(16px + env(safe-area-inset-left))",
          }}
        >
          <Paper
            aria-live="polite"
            role="status"
            variant="outlined"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 38fr) minmax(0, 62fr)" },
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <RecoveryStepVisual visualKey="success" />
            <Stack spacing={2} sx={{ justifyContent: "center", p: { xs: 3, lg: 5 }, textAlign: { xs: "center", lg: "left" } }}>
              <Typography component="h1" ref={titleRef} tabIndex={-1} variant="h4" sx={{ color: "secondary.main", fontWeight: 700 }}>
                Contraseña actualizada
              </Typography>
              <Button component={Link} fullWidth href="/" variant="contained">
                Iniciar sesión
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

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
              minHeight: { sm: 640, lg: 600 },
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
              <RecoveryStepVisual visualKey={currentContent.visualKey} />
            </Box>
            <Box
              sx={{
                display: "flex",
                width: "100%",
                maxWidth: { xs: 680, lg: "none" },
                minWidth: 0,
                mx: "auto",
                flexDirection: "column",
                p: { xs: 2, sm: 3, lg: 4 },
              }}
            >
              <Stack spacing={1}>
                <Typography color="text.secondary" id="recovery-progress-label" variant="body2">
                  Paso {step + 1} de 3
                </Typography>
                <LinearProgress
                  aria-labelledby="recovery-progress-label"
                  value={((step + 1) / 3) * 100}
                  variant="determinate"
                />
                <Typography
                  component="h1"
                  ref={titleRef}
                  tabIndex={-1}
                  variant="h4"
                  sx={{ pt: 1, color: "secondary.main", fontWeight: 700 }}
                >
                  {currentContent.title}
                </Typography>
                {currentContent.description && (
                  <Typography color="text.secondary">{currentContent.description}</Typography>
                )}
              </Stack>

              <Box
                component="form"
                noValidate
                onSubmit={step === 0 ? submitRequest : step === 1 ? submitCode : submitPassword}
                sx={{ flex: 1, display: "flex", flexDirection: "column", pt: 3 }}
              >
                <Box
                  sx={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: step === 0 ? "center" : "flex-start",
                  }}
                >
                  {step === 0 && (
                    <RecoveryRequestStep
                      fieldError={requestError}
                      generalError={requestGeneralError}
                      identifier={data.identifier}
                      inputRef={identifierRef}
                      onChange={(value) => updateData("identifier", value)}
                      statusMessage={requestStatus}
                    />
                  )}
                  {step === 1 && (
                    <RecoveryCodeStep
                      code={code}
                      countdownLabel={countdownLabel}
                      destinationLabel={destinationLabel}
                      error={codeError}
                      inputRef={codeRef}
                      isUnavailable={isCodeUnavailable}
                      onChange={(value) => {
                        setCode(value);
                        if (!isCodeUnavailable) setCodeError("");
                      }}
                      onResend={resendCode}
                      requestStatus={requestStatusMessage}
                      resendMessage={resendMessage}
                    />
                  )}
                  {step === 2 && (
                    <RecoveryPasswordStep
                      confirmationRef={confirmationRef}
                      data={data}
                      errors={errors}
                      onChange={updateData}
                      passwordRef={passwordRef}
                    />
                  )}
                </Box>

                <Stack
                  direction={{ xs: "column-reverse", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    mt: "auto",
                    pt: 3,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {step > 0 && (
                    <Button fullWidth onClick={goBack} type="button" variant="outlined">
                      Atrás
                    </Button>
                  )}
                  <Button
                    disabled={step === 1 && isCodeUnavailable}
                    fullWidth
                    loading={isLoading}
                    type="submit"
                    variant="contained"
                  >
                    {step === 0
                      ? "Enviar código"
                      : step === 1
                        ? "Validar código"
                        : "Actualizar contraseña"}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
