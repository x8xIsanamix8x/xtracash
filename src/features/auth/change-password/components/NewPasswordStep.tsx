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

import type { ChangePasswordData, ChangePasswordErrors } from "../types";
import { changePasswordRules } from "../validation";

type NewPasswordStepProps = Readonly<{
  data: ChangePasswordData;
  errors: ChangePasswordErrors;
  newPasswordRef: React.RefObject<HTMLInputElement | null>;
  confirmationRef: React.RefObject<HTMLInputElement | null>;
  onChange: (field: "newPassword" | "passwordConfirmation", value: string) => void;
}>;

export function NewPasswordStep({
  data,
  errors,
  newPasswordRef,
  confirmationRef,
  onChange,
}: NewPasswordStepProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <Stack spacing={2}>
      <TextField
        autoComplete="new-password"
        error={Boolean(errors.newPassword)}
        fullWidth
        helperText={errors.newPassword}
        inputRef={newPasswordRef}
        label="Nueva contraseña"
        name="newPassword"
        onChange={(event) => onChange("newPassword", event.target.value)}
        required
        slotProps={{
          formHelperText: { role: "alert" },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  aria-pressed={showNewPassword}
                  onClick={() => setShowNewPassword((current) => !current)}
                  onMouseDown={keepFocus}
                  type="button"
                  sx={{ color: themeTokens.color.brandLogo }}
                >
                  {showNewPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        type={showNewPassword ? "text" : "password"}
        value={data.newPassword}
      />
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}>
        <Typography color="text.secondary" variant="body2">
          Tu contraseña debe incluir:
        </Typography>
        <List dense disablePadding>
          {changePasswordRules.map((rule) => {
            const isMet = rule.test(data.newPassword);

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
