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

import type { RegistrationData, RegistrationErrors, RegistrationInputRefs } from "../types";
import { passwordRules } from "../validation";

type ContactSecurityStepProps = Readonly<{
  data: RegistrationData;
  errors: RegistrationErrors;
  inputRefs: RegistrationInputRefs;
  onChange: (field: keyof RegistrationData, value: string) => void;
}>;

export function ContactSecurityStep({ data, errors, inputRefs, onChange }: ContactSecurityStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <Stack spacing={2}>
      <TextField
        autoComplete="tel"
        error={Boolean(errors.phone)}
        fullWidth
        helperText={errors.phone}
        inputRef={inputRefs.phone}
        label="Teléfono"
        name="phone"
        onChange={(event) => onChange("phone", event.target.value)}
        required
        slotProps={{ htmlInput: { inputMode: "tel", maxLength: 11 } }}
        type="tel"
        value={data.phone}
      />
      <TextField
        autoComplete="email"
        error={Boolean(errors.email)}
        fullWidth
        helperText={errors.email}
        inputRef={inputRefs.email}
        label="Correo electrónico"
        name="email"
        onChange={(event) => onChange("email", event.target.value)}
        required
        slotProps={{ htmlInput: { inputMode: "email" } }}
        type="email"
        value={data.email}
      />
      <TextField
        autoComplete="new-password"
        error={Boolean(errors.password)}
        fullWidth
        helperText={errors.password}
        inputRef={inputRefs.password}
        label="Contraseña"
        name="password"
        onChange={(event) => onChange("password", event.target.value)}
        required
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
      <Box>
        <Typography color="text.secondary" variant="body2">Tu contraseña debe incluir:</Typography>
        <List dense disablePadding>
          {passwordRules.map((rule) => {
            const isMet = rule.test(data.password);
            return (
              <ListItem disableGutters key={rule.label} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32, color: isMet ? "success.main" : "text.secondary" }}>
                  {isMet ? <CheckCircleRounded fontSize="small" /> : <RadioButtonUncheckedRounded fontSize="small" />}
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
        inputRef={inputRefs.passwordConfirmation}
        label="Confirmar contraseña"
        name="passwordConfirmation"
        onChange={(event) => onChange("passwordConfirmation", event.target.value)}
        required
        slotProps={{
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
