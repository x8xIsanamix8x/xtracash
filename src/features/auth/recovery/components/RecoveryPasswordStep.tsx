"use client";

import { MouseEvent, useState } from "react";
import {
  CheckCircleRounded,
  RadioButtonUncheckedRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import type { RecoveryData, RecoveryErrors } from "../types";
import { recoveryPasswordRules } from "../validation";

type RecoveryPasswordStepProps = Readonly<{
  data: RecoveryData;
  errors: RecoveryErrors;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  confirmationRef: React.RefObject<HTMLInputElement | null>;
  onChange: (field: "password" | "passwordConfirmation", value: string) => void;
}>;

export function RecoveryPasswordStep({
  data,
  errors,
  passwordRef,
  confirmationRef,
  onChange,
}: RecoveryPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <Stack spacing={2}>
      <TextField
        autoComplete="new-password"
        error={Boolean(errors.password)}
        fullWidth
        helperText={errors.password}
        inputRef={passwordRef}
        label="Nueva contraseña"
        name="password"
        onChange={(event) => onChange("password", event.target.value)}
        required
        slotProps={{
          formHelperText: { role: "alert" },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  onMouseDown={keepFocus}
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
        value={data.password}
      />
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
          Tu contraseña debe incluir:
        </Typography>
        <List dense disablePadding>
          {recoveryPasswordRules.map((rule) => {
            const isMet = rule.test(data.password);

            return (
              <ListItem disableGutters key={rule.label} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32, color: isMet ? "success.main" : "text.secondary" }}>
                  {isMet
                    ? <CheckCircleRounded fontSize="small" />
                    : <RadioButtonUncheckedRounded fontSize="small" />}
                </ListItemIcon>
                <ListItemText primary={`${rule.label}: ${isMet ? "cumplida" : "pendiente"}`} />
              </ListItem>
            );
          })}
        </List>
      </Box>
      <TextField
        autoComplete="new-password"
        error={Boolean(errors.passwordConfirmation)}
        fullWidth
        helperText={errors.passwordConfirmation}
        inputRef={confirmationRef}
        label="Confirmar contraseña"
        name="passwordConfirmation"
        onChange={(event) => onChange("passwordConfirmation", event.target.value)}
        required
        slotProps={{
          formHelperText: { role: "alert" },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}
                  aria-pressed={showConfirmation}
                  onClick={() => setShowConfirmation((current) => !current)}
                  onMouseDown={keepFocus}
                  type="button"
                  sx={{ color: themeTokens.color.brandLogo }}
                >
                  {showConfirmation ? <VisibilityOffRounded /> : <VisibilityRounded />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        type={showConfirmation ? "text" : "password"}
        value={data.passwordConfirmation}
      />
    </Stack>
  );
}
