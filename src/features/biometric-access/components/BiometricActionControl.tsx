"use client";

import { FingerprintRounded } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonBase,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

import { themeTokens } from "@/theme/tokens";

import type { StartBiometricFlow } from "../types";
import { useBiometricAccess } from "../client/useBiometricAccess";

type BiometricActionControlProps = Readonly<{
  actionLabel: string;
  buttonVariant?: ButtonProps["variant"];
  onAction: StartBiometricFlow;
  presentation?: "button" | "login-icon";
}>;

const INCOMPATIBLE_MESSAGE =
  "Este dispositivo o navegador no permite el acceso biométrico.";

export function BiometricActionControl({
  actionLabel,
  buttonVariant = "outlined",
  onAction,
  presentation = "button",
}: BiometricActionControlProps) {
  const { checkCapability, start, status } = useBiometricAccess(onAction);
  const isChecking = status === "checking";
  const canStart = ["supported", "cancelled"].includes(status);

  return (
    <Stack aria-busy={isChecking} aria-live="polite" spacing={1.25}>
      {isChecking && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CircularProgress aria-hidden="true" size={20} />
          <Typography color="text.secondary" variant="body2">
            Comprobando acceso biométrico…
          </Typography>
        </Stack>
      )}

      {(status === "unsupported" || status === "unavailable") && (
        <Typography color="text.secondary" role="status" variant="body2">
          {INCOMPATIBLE_MESSAGE}
        </Typography>
      )}

      {status === "cancelled" && (
        <Alert severity="info" variant="standard">
          Se canceló la solicitud biométrica. Puedes intentarlo nuevamente.
        </Alert>
      )}

      {status === "error" && (
        <Alert
          action={(
            <Button color="inherit" onClick={checkCapability} size="small" type="button">
              Comprobar
            </Button>
          )}
          severity="error"
          variant="standard"
        >
          No pudimos comprobar el acceso biométrico.
        </Alert>
      )}

      {canStart && (
        presentation === "login-icon" ? (
          <ButtonBase
            onClick={() => void start()}
            type="button"
            sx={{
              width: "100%",
              minHeight: 56,
              borderRadius: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.25,
              px: 1.5,
              color: "primary.main",
              "&:focus-visible": {
                outline: `3px solid ${themeTokens.color.focus}`,
                outlineOffset: 2,
              },
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>
              {actionLabel}
            </Typography>
            <FingerprintRounded aria-hidden="true" sx={{ width: 32, height: 32 }} />
          </ButtonBase>
        ) : (
          <Button
            fullWidth
            onClick={() => void start()}
            startIcon={<FingerprintRounded aria-hidden="true" />}
            type="button"
            variant={buttonVariant}
          >
            {actionLabel}
          </Button>
        )
      )}
    </Stack>
  );
}
