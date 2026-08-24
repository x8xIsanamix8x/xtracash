"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";

import { recoveryRequestedUrl } from "@/lib/accessNotificationNavigation";

import { SecurityFlowShell } from "../shared/components/SecurityFlowShell";
import { SecurityFlowSuccess } from "../shared/components/SecurityFlowSuccess";
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
  const [isComplete, setIsComplete] = useState(false);
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
    titleRef.current?.focus({ preventScroll: true });

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

  useEffect(() => {
    if (isComplete) titleRef.current?.focus({ preventScroll: true });
  }, [isComplete]);

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
      setIsComplete(true);
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

  if (isComplete) {
    return (
      <SecurityFlowShell
        backHref="/"
        backLabel="Volver a la pantalla de acceso"
        contentCentered
        visual={<RecoveryStepVisual success />}
      >
        <SecurityFlowSuccess
          actionLabel="Volver al acceso"
          message="Te enviamos las instrucciones para restablecer tu contraseña. Revisa también la carpeta de correo no deseado."
          onAction={() => router.replace(recoveryRequestedUrl)}
          title="Revisa tu correo"
          titleRef={titleRef}
        />
      </SecurityFlowShell>
    );
  }

  return (
    <SecurityFlowShell
      backHref="/"
      backLabel="Volver a la pantalla de acceso"
      contentCentered
      visual={<RecoveryStepVisual />}
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
    </SecurityFlowShell>
  );
}
