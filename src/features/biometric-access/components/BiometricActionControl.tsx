"use client";

import { FingerprintRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

import { themeTokens } from "@/theme/tokens";
import { useOnlineStatus } from "@/features/pwa/useOnlineStatus";

import type { StartBiometricFlow } from "../types";
import { useBiometricAccess } from "../client/useBiometricAccess";

type BiometricActionControlProps = Readonly<{
  actionLabel: string;
  buttonVariant?: ButtonProps["variant"];
  onAction: StartBiometricFlow;
  presentation?: "button" | "login-icon";
  disabled?: boolean;
}>;

const INCOMPATIBLE_MESSAGE =
  "Este dispositivo o navegador no permite el acceso biométrico.";

export function BiometricActionControl({
  actionLabel,
  buttonVariant = "outlined",
  onAction,
  presentation = "button",
  disabled = false,
}: BiometricActionControlProps) {
  const { checkCapability, start, status, message } = useBiometricAccess(onAction);
  const isChecking = status === "checking";
  const isOnline = useOnlineStatus();
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
          La solicitud se canceló o venció. Puedes intentarlo nuevamente.
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
          {message || "No pudimos comprobar el acceso biométrico."}
        </Alert>
      )}

      {!isOnline && <Typography role="status" variant="body2">Conéctate a internet para continuar.</Typography>}
      {canStart && isOnline && (
        presentation === "login-icon" ? (
          <ButtonBase
            disabled={disabled}
            onClick={() => void start()}
            type="button"
            sx={{
              alignSelf: "center",
              minHeight: 44,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1,
              color: themeTokens.color.preLoginNavy,
              "&:focus-visible": {
                outline: `3px solid ${themeTokens.color.preLoginPrimary}`,
                outlineOffset: 2,
              },
              "&.Mui-disabled": { opacity: 0.5 },
            }}
          >
            <Box
              alt=""
              aria-hidden="true"
              component="img"
              src="/entry/face-scan.svg"
              sx={{ display: "block", width: 50, height: 50 }}
            />
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              {actionLabel}
            </Typography>
          </ButtonBase>
        ) : (
          <Button
            disabled={disabled}
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
