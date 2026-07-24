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

import { ChangePasswordSuccess } from "./components/ChangePasswordSuccess";
import {
  ChangePasswordVisual,
  type ChangePasswordVisualKey,
} from "./components/ChangePasswordVisual";
import { IdentityVerificationStep } from "./components/IdentityVerificationStep";
import { NewPasswordStep } from "./components/NewPasswordStep";
import { changePasswordMock } from "./mocks/changePassword";
import type {
  ChangePasswordData,
  ChangePasswordErrors,
  ChangePasswordField,
  ChangePasswordStep,
  VerificationMethod,
} from "./types";
import {
  validateCurrentPassword,
  validateNewPassword,
  validateVerificationCode,
} from "./validation";

const initialData: ChangePasswordData = {
  currentPassword: "",
  newPassword: "",
  passwordConfirmation: "",
};

const stepContent: Record<ChangePasswordStep, {
  title: string;
  description: string;
  visualKey: ChangePasswordVisualKey;
}> = {
  verification: {
    title: "Verifica tu identidad",
    description: "Elige cómo confirmar que eres tú antes de cambiar tu contraseña.",
    visualKey: "verification",
  },
  "new-password": {
    title: "Crea una nueva contraseña",
    description: "Define una contraseña segura para proteger tu cuenta.",
    visualKey: "new-password",
  },
};

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `El código vence en ${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function ChangePasswordView() {
  const [step, setStep] = useState<ChangePasswordStep>("verification");
  const [method, setMethod] = useState<VerificationMethod>("current-password");
  const [data, setData] = useState<ChangePasswordData>(initialData);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeUnavailable, setIsCodeUnavailable] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(changePasswordMock.maximumAttempts);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(changePasswordMock.codeLifetimeSeconds);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
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

  const startCountdown = () => {
    clearCountdown();
    const expiresAt = Date.now() + changePasswordMock.codeLifetimeSeconds * 1000;
    expiresAtRef.current = expiresAt;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) expireCode();
    };

    updateCountdown();
    countdownTimerRef.current = window.setInterval(updateCountdown, 1000);
  };

  const resetCodeSession = (statusMessage: string) => {
    setCode("");
    setCodeError("");
    setCodeStatus(statusMessage);
    setAttemptsRemaining(changePasswordMock.maximumAttempts);
    setIsCodeUnavailable(false);
    setIsCodeSent(true);
    startCountdown();
  };

  const clearSensitiveState = () => {
    setData(initialData);
    setErrors({});
    setCurrentPasswordError("");
    setCode("");
    setCodeError("");
    setCodeStatus("");
    setIsCodeSent(false);
    setIsCodeUnavailable(false);
    setAttemptsRemaining(changePasswordMock.maximumAttempts);
    setSecondsRemaining(changePasswordMock.codeLifetimeSeconds);
    expiresAtRef.current = null;
  };

  useEffect(() => {
    titleRef.current?.focus();
  }, [step, isComplete]);

  useEffect(() => {
    if (
      step === "verification"
      && method === "code"
      && isCodeSent
      && !isLoading
    ) {
      codeRef.current?.focus();
    }
  }, [isCodeSent, isLoading, method, step]);

  useEffect(() => () => {
    operationRef.current += 1;
    if (simulationTimerRef.current !== null) window.clearTimeout(simulationTimerRef.current);
    if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current);
  }, []);

  const runSimulation = (callback: () => void) => {
    if (isLoading || simulationTimerRef.current !== null) return;
    setIsLoading(true);
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    simulationTimerRef.current = window.setTimeout(() => {
      if (operationRef.current !== operation) return;
      simulationTimerRef.current = null;
      setIsLoading(false);
      callback();
    }, changePasswordMock.simulationDelay);
  };

  const changeMethod = (nextMethod: VerificationMethod) => {
    clearSimulation();
    clearCountdown();
    clearSensitiveState();
    setMethod(nextMethod);
  };

  const submitCurrentPassword = () => {
    const nextError = validateCurrentPassword(data.currentPassword);
    setCurrentPasswordError(nextError);
    if (nextError) {
      currentPasswordRef.current?.focus();
      return;
    }

    runSimulation(() => {
      if (data.currentPassword === changePasswordMock.invalidCurrentPassword) {
        setCurrentPasswordError(
          "La contraseña actual es incorrecta. Verifica los datos e inténtalo nuevamente.",
        );
        currentPasswordRef.current?.focus();
        return;
      }

      setData((current) => ({ ...current, currentPassword: "" }));
      setStep("new-password");
    });
  };

  const sendCode = (isResend = false) => {
    if (isLoading || simulationTimerRef.current !== null) return;

    clearCountdown();
    expiresAtRef.current = null;
    setCode("");
    setCodeError("");
    setCodeStatus("");
    setAttemptsRemaining(changePasswordMock.maximumAttempts);
    setIsCodeUnavailable(false);
    setSecondsRemaining(changePasswordMock.codeLifetimeSeconds);

    runSimulation(() => {
      resetCodeSession(
        isResend
          ? "Código reenviado de forma demostrativa."
          : "Código enviado de forma demostrativa.",
      );
    });
  };

  const submitCode = () => {
    if (isCodeUnavailable) return;
    if (expiresAtRef.current === null || expiresAtRef.current <= Date.now()) {
      expireCode();
      return;
    }

    const formatError = validateVerificationCode(code);
    if (formatError) {
      setCodeError(formatError);
      codeRef.current?.focus();
      return;
    }

    if (code !== changePasswordMock.validCode) {
      const nextAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(nextAttempts);

      if (nextAttempts === 0) {
        clearCountdown();
        setIsCodeUnavailable(true);
        const message = "Alcanzaste el número máximo de intentos. Solicita un nuevo código.";
        setCodeError(message);
      } else {
        setCodeError(`El código es incorrecto. Te quedan ${nextAttempts} intentos.`);
      }
      codeRef.current?.focus();
      return;
    }

    clearCountdown();
    setCode("");
    setCodeError("");
    setCodeStatus("");
    setStep("new-password");
  };

  const submitVerification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    if (method === "current-password") {
      submitCurrentPassword();
      return;
    }

    if (!isCodeSent) {
      sendCode();
      return;
    }

    submitCode();
  };

  const updateData = (field: ChangePasswordField, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));

    if (field === "currentPassword") setCurrentPasswordError("");
    if (field === "newPassword" && data.passwordConfirmation) {
      setErrors((current) => ({
        ...current,
        passwordConfirmation:
          data.passwordConfirmation === value ? undefined : "Las contraseñas no coinciden.",
      }));
    }
  };

  const submitNewPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const nextErrors = validateNewPassword(data);
    setErrors(nextErrors);
    if (nextErrors.newPassword) {
      newPasswordRef.current?.focus();
      return;
    }
    if (nextErrors.passwordConfirmation) {
      confirmationRef.current?.focus();
      return;
    }

    runSimulation(() => {
      clearCountdown();
      clearSensitiveState();
      setIsComplete(true);
    });
  };

  const goBack = () => {
    clearSimulation();
    clearCountdown();
    clearSensitiveState();
    setStep("verification");
  };

  const currentContent = stepContent[step];
  const countdownLabel = secondsRemaining === 0
    ? "El código ya no está vigente"
    : formatCountdown(secondsRemaining);
  const primaryLabel = method === "current-password"
    ? "Continuar"
    : isCodeSent
      ? "Validar código"
      : "Enviar código";

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
          <Paper variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 38fr) minmax(0, 62fr)" }, overflow: "hidden", boxShadow: "none" }}>
            <ChangePasswordVisual visualKey="success" />
            <ChangePasswordSuccess titleRef={titleRef} />
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
          <IconButton aria-label="Volver al perfil" component={Link} href="/profile">
            <ArrowBackRounded />
          </IconButton>
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800 }}>xtracash</Typography>
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
            <Box sx={{ minWidth: 0, overflow: "hidden", borderBottom: { xs: "1px solid", lg: 0 }, borderRight: { xs: 0, lg: "1px solid" }, borderColor: "divider" }}>
              <ChangePasswordVisual visualKey={currentContent.visualKey} />
            </Box>
            <Box sx={{ display: "flex", width: "100%", maxWidth: { xs: 680, lg: "none" }, minWidth: 0, mx: "auto", flexDirection: "column", p: { xs: 2, sm: 3, lg: 4 } }}>
              <Stack spacing={1}>
                <Typography color="text.secondary" id="change-password-progress" variant="body2">
                  Paso {step === "verification" ? 1 : 2} de 2
                </Typography>
                <LinearProgress aria-labelledby="change-password-progress" value={step === "verification" ? 50 : 100} variant="determinate" />
                <Typography component="h1" ref={titleRef} tabIndex={-1} variant="h4" sx={{ pt: 1, color: "secondary.main", fontWeight: 700 }}>
                  {currentContent.title}
                </Typography>
                <Typography color="text.secondary">{currentContent.description}</Typography>
              </Stack>
              <Box component="form" noValidate onSubmit={step === "verification" ? submitVerification : submitNewPassword} sx={{ flex: 1, display: "flex", flexDirection: "column", pt: 3 }}>
                <Box sx={{ flex: 1 }}>
                  {step === "verification" ? (
                    <IdentityVerificationStep
                      code={code}
                      codeError={codeError}
                      codeRef={codeRef}
                      codeStatus={codeStatus}
                      countdownLabel={countdownLabel}
                      currentPassword={data.currentPassword}
                      currentPasswordError={currentPasswordError}
                      currentPasswordRef={currentPasswordRef}
                      isCodeSent={isCodeSent}
                      isCodeUnavailable={isCodeUnavailable}
                      isLoading={isLoading}
                      method={method}
                      onCodeChange={(value) => {
                        setCode(value);
                        if (!isCodeUnavailable) setCodeError("");
                      }}
                      onCurrentPasswordChange={(value) => updateData("currentPassword", value)}
                      onMethodChange={changeMethod}
                      onResend={() => sendCode(true)}
                      phoneLabel={changePasswordMock.phoneLabel}
                    />
                  ) : (
                    <NewPasswordStep
                      confirmationRef={confirmationRef}
                      data={data}
                      errors={errors}
                      newPasswordRef={newPasswordRef}
                      onChange={updateData}
                    />
                  )}
                </Box>
                <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} sx={{ mt: "auto", pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
                  {step === "new-password" && (
                    <Button fullWidth onClick={goBack} type="button" variant="outlined">Atrás</Button>
                  )}
                  <Button
                    disabled={method === "code" && isCodeSent && isCodeUnavailable}
                    fullWidth
                    loading={isLoading}
                    type="submit"
                    variant="contained"
                  >
                    {step === "verification" ? primaryLabel : "Actualizar contraseña"}
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
