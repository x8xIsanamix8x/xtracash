"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

import {
  getProfilePersonalInfo,
  ProfileServiceError,
} from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { RecoveryStepVisual } from "../recovery/components/RecoveryStepVisual";
import {
  maskRecoveryEmail,
  PROFILE_RECOVERY_SUCCESS_MESSAGE,
} from "../recovery/presentation";
import {
  createAuthenticatedRecoveryRequest,
  requestPasswordRecovery,
  RecoveryServiceError,
} from "../recovery/services/recovery";
import { SecurityFlowShell } from "../shared/components/SecurityFlowShell";
import { SecurityFlowSuccess } from "../shared/components/SecurityFlowSuccess";

type ChangePasswordStatus = "error" | "loading" | "ready" | "success";

export function ChangePasswordView() {
  const router = useRouter();
  const [status, setStatus] = useState<ChangePasswordStatus>("loading");
  const [email, setEmail] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const profileRequestRef = useRef<AbortController | null>(null);
  const recoveryRequestRef = useRef<AbortController | null>(null);
  const submissionRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadEmail = useCallback(() => {
    if (profileRequestRef.current !== null) return;

    const controller = new AbortController();
    profileRequestRef.current = controller;
    setStatus("loading");
    setEmail("");
    setRequestError("");

    void getProfilePersonalInfo(controller.signal)
      .then((personalInfo) => {
        if (!isMountedRef.current || profileRequestRef.current !== controller) return;
        setEmail(personalInfo.email);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current || profileRequestRef.current !== controller) return;
        if (error instanceof ProfileServiceError && error.type === "aborted") return;

        if (error instanceof ProfileServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }

        setStatus("error");
      })
      .finally(() => {
        if (profileRequestRef.current === controller) profileRequestRef.current = null;
      });
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;
    loadEmail();

    return () => {
      isMountedRef.current = false;
      profileRequestRef.current?.abort();
      profileRequestRef.current = null;
      recoveryRequestRef.current?.abort();
      recoveryRequestRef.current = null;
      submissionRef.current = false;
    };
  }, [loadEmail]);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [status]);

  const submitRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "ready" || !email || submissionRef.current) return;

    const controller = new AbortController();
    submissionRef.current = true;
    recoveryRequestRef.current = controller;
    setIsSubmitting(true);
    setRequestError("");

    try {
      await requestPasswordRecovery(createAuthenticatedRecoveryRequest(), controller.signal);
      if (!isMountedRef.current || recoveryRequestRef.current !== controller) return;

      setEmail("");
      setStatus("success");
    } catch (error) {
      if (!isMountedRef.current || recoveryRequestRef.current !== controller) return;
      if (error instanceof RecoveryServiceError && error.type === "aborted") return;

      if (error instanceof RecoveryServiceError && error.type === "unauthenticated") {
        router.replace(sessionExpiredUrl);
        return;
      }

      setRequestError("No pudimos enviar el enlace. Inténtalo nuevamente.");
    } finally {
      if (recoveryRequestRef.current === controller) {
        recoveryRequestRef.current = null;
        submissionRef.current = false;
        if (isMountedRef.current) setIsSubmitting(false);
      }
    }
  };

  if (status === "success") {
    return (
      <SecurityFlowShell
        backHref="/profile"
        backLabel="Volver al perfil"
        contentCentered
        visual={<RecoveryStepVisual success />}
      >
        <SecurityFlowSuccess
          actionLabel="Volver al perfil"
          message={PROFILE_RECOVERY_SUCCESS_MESSAGE}
          onAction={() => router.replace("/profile")}
          title="Revisa tu correo"
          titleRef={titleRef}
        />
      </SecurityFlowShell>
    );
  }

  return (
    <SecurityFlowShell
      backHref="/profile"
      backLabel="Volver al perfil"
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
          Cambiar contraseña
        </Typography>
        <Typography color="text.secondary">
          Te enviaremos un enlace a tu correo para que puedas cambiar tu contraseña de forma segura.
        </Typography>
      </Stack>

      {status === "loading" && (
        <Stack
          aria-live="polite"
          role="status"
          spacing={2}
          sx={{ minHeight: 160, alignItems: "center", justifyContent: "center", pt: 3 }}
        >
          <CircularProgress aria-hidden="true" size={32} />
          <Typography color="text.secondary">Cargando tu información…</Typography>
        </Stack>
      )}

      {status === "error" && (
        <Stack spacing={2} sx={{ pt: 3 }}>
          <Alert aria-live="assertive" role="alert" severity="error">
            No pudimos cargar tu correo. Inténtalo nuevamente.
          </Alert>
          <Button fullWidth onClick={loadEmail} type="button" variant="contained">
            Reintentar
          </Button>
        </Stack>
      )}

      {status === "ready" && (
        <Box
          aria-busy={isSubmitting}
          component="form"
          noValidate
          onSubmit={submitRecovery}
          sx={{ display: "flex", flexDirection: "column", pt: 3 }}
        >
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Enviaremos el enlace a
            </Typography>
            <Typography sx={{ color: "secondary.main", fontWeight: 700, overflowWrap: "anywhere" }}>
              {maskRecoveryEmail(email)}
            </Typography>
          </Box>

          {requestError && (
            <Alert aria-live="assertive" role="alert" severity="error" sx={{ mt: 2 }}>
              {requestError}
            </Alert>
          )}

          <Button
            disabled={isSubmitting}
            fullWidth
            loading={isSubmitting}
            sx={{ mt: 3 }}
            type="submit"
            variant="contained"
          >
            {requestError ? "Reintentar" : "Enviar enlace"}
          </Button>
        </Box>
      )}
    </SecurityFlowShell>
  );
}
