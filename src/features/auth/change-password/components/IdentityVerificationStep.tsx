"use client";

import { MouseEvent, useState } from "react";
import { VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import type { VerificationMethod } from "../types";

type IdentityVerificationStepProps = Readonly<{
  method: VerificationMethod;
  currentPassword: string;
  currentPasswordError: string;
  currentPasswordRef: React.RefObject<HTMLInputElement | null>;
  code: string;
  codeError: string;
  codeRef: React.RefObject<HTMLInputElement | null>;
  codeStatus: string;
  countdownLabel: string;
  isCodeSent: boolean;
  isCodeUnavailable: boolean;
  isLoading: boolean;
  phoneLabel: string;
  onCodeChange: (value: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onMethodChange: (method: VerificationMethod) => void;
  onResend: () => void;
}>;

export function IdentityVerificationStep({
  method,
  currentPassword,
  currentPasswordError,
  currentPasswordRef,
  code,
  codeError,
  codeRef,
  codeStatus,
  countdownLabel,
  isCodeSent,
  isCodeUnavailable,
  isLoading,
  phoneLabel,
  onCodeChange,
  onCurrentPasswordChange,
  onMethodChange,
  onResend,
}: IdentityVerificationStepProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <Stack spacing={2.5}>
      <FormControl>
        <FormLabel id="verification-method-label">Elige cómo verificar tu identidad</FormLabel>
        <RadioGroup
          aria-labelledby="verification-method-label"
          name="verification-method"
          onChange={(event) => onMethodChange(event.target.value as VerificationMethod)}
          value={method}
          sx={{ gap: 1.5, pt: 1.5 }}
        >
          <Box sx={{ border: "1px solid", borderColor: method === "current-password" ? "primary.main" : "divider", borderRadius: 2 }}>
            <FormControlLabel
              control={<Radio />}
              label="Usar mi contraseña actual"
              value="current-password"
              sx={{ width: "100%", minHeight: 48, m: 0, px: 1 }}
            />
          </Box>
          <Box sx={{ border: "1px solid", borderColor: method === "code" ? "primary.main" : "divider", borderRadius: 2 }}>
            <FormControlLabel
              control={<Radio />}
              label="Recibir un código"
              value="code"
              sx={{ width: "100%", minHeight: 48, m: 0, px: 1 }}
            />
          </Box>
        </RadioGroup>
      </FormControl>

      {method === "current-password" ? (
        <TextField
          autoComplete="current-password"
          error={Boolean(currentPasswordError)}
          fullWidth
          helperText={currentPasswordError}
          inputRef={currentPasswordRef}
          label="Contraseña actual"
          name="currentPassword"
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
          required
          slotProps={{
            formHelperText: { role: "alert" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                    aria-pressed={showCurrentPassword}
                    onClick={() => setShowCurrentPassword((current) => !current)}
                    onMouseDown={keepFocus}
                    type="button"
                    sx={{ color: themeTokens.color.brandLogo }}
                  >
                    {showCurrentPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          type={showCurrentPassword ? "text" : "password"}
          value={currentPassword}
        />
      ) : (
        <Stack spacing={1.5}>
          <Typography sx={{ color: "secondary.main", fontWeight: 700 }}>
            {phoneLabel}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Si la información coincide, recibirás un código de verificación.
          </Typography>
          {isCodeSent && (
            <>
              <TextField
                autoComplete="one-time-code"
                disabled={isCodeUnavailable}
                error={Boolean(codeError)}
                fullWidth
                helperText={codeError}
                inputRef={codeRef}
                label="Código de verificación"
                name="code"
                onChange={(event) => onCodeChange(event.target.value)}
                required
                slotProps={{
                  formHelperText: { role: "alert" },
                  htmlInput: { inputMode: "numeric", maxLength: 6 },
                }}
                value={code}
              />
              <Typography
                aria-label={`Vigencia del código: ${countdownLabel}`}
                color="text.secondary"
                variant="body2"
              >
                {countdownLabel}
              </Typography>
              <Button
                loading={isLoading}
                onClick={onResend}
                sx={{ alignSelf: "flex-start" }}
                type="button"
                variant="text"
              >
                Reenviar código
              </Button>
            </>
          )}
          <Typography
            aria-live="polite"
            color="text.secondary"
            role="status"
            sx={{ minHeight: "1.5em" }}
            variant="body2"
          >
            {codeStatus || "\u00a0"}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
