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
  Divider,
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
import { doPasswordsMatch, passwordRules } from "../validation";

type ContactSecurityStepProps = Readonly<{
  data: RegistrationData;
  errors: RegistrationErrors;
  inputRefs: RegistrationInputRefs;
  onChange: (field: keyof RegistrationData, value: string) => void;
  onConfirmationBlur: () => void;
}>;

export function ContactSecurityStep({
  data,
  errors,
  inputRefs,
  onChange,
  onConfirmationBlur,
}: ContactSecurityStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordsMatch = doPasswordsMatch(data.password, data.passwordConfirmation);
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <Stack spacing={2.5}>
      <Stack spacing={2}>
        <Typography component="h2" variant="subtitle1" sx={{ color: "secondary.main", fontWeight: 700 }}>
          Datos de contacto
        </Typography>
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
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography component="h2" variant="subtitle1" sx={{ color: "secondary.main", fontWeight: 700 }}>
          Seguridad de la cuenta
        </Typography>
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
            formHelperText: errors.password ? { id: "password-error", role: "alert" } : undefined,
            htmlInput: {
              "aria-describedby": errors.password
                ? "password-error password-requirements"
                : "password-requirements",
            },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    onMouseDown={keepFocus}
                    type="button"
                    sx={{ minWidth: 44, minHeight: 44, color: themeTokens.color.brandLogo }}
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
        <TextField
          autoComplete="new-password"
          error={Boolean(errors.passwordConfirmation)}
          fullWidth
          helperText={errors.passwordConfirmation}
          inputRef={inputRefs.passwordConfirmation}
          label="Confirmar contraseña"
          name="passwordConfirmation"
          onBlur={onConfirmationBlur}
          onChange={(event) => onChange("passwordConfirmation", event.target.value)}
          required
          slotProps={{
            formHelperText: errors.passwordConfirmation
              ? { id: "password-confirmation-error", role: "alert" }
              : undefined,
            htmlInput: {
              "aria-describedby": errors.passwordConfirmation
                ? "password-confirmation-error password-requirements"
                : "password-requirements",
            },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}
                    aria-pressed={showConfirmation}
                    onClick={() => setShowConfirmation((current) => !current)}
                    onMouseDown={keepFocus}
                    type="button"
                    sx={{ minWidth: 44, minHeight: 44, color: themeTokens.color.brandLogo }}
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
        <Box
          aria-live="polite"
          id="password-requirements"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography color="text.secondary" variant="body2">Tu contraseña debe incluir:</Typography>
          <List dense disablePadding>
            {passwordRules.map((rule) => {
              const isMet = rule.test(data.password);
              return (
                <ListItem
                  aria-label={`${rule.label}: ${isMet ? "cumplido" : "por cumplir"}`}
                  disableGutters
                  key={rule.label}
                  sx={{ py: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isMet ? "success.main" : "text.secondary" }}>
                    {isMet ? <CheckCircleRounded fontSize="small" /> : <RadioButtonUncheckedRounded fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={rule.label}
                    secondary={rule.helpText}
                  />
                </ListItem>
              );
            })}
            <ListItem
              aria-label={`Las contraseñas coinciden: ${passwordsMatch ? "cumplido" : "por cumplir"}`}
              disableGutters
              sx={{ py: 0 }}
            >
              <ListItemIcon
                sx={{ minWidth: 32, color: passwordsMatch ? "success.main" : "text.secondary" }}
              >
                {passwordsMatch ? (
                  <CheckCircleRounded fontSize="small" />
                ) : (
                  <RadioButtonUncheckedRounded fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary="Las contraseñas coinciden" />
            </ListItem>
          </List>
        </Box>
      </Stack>
    </Stack>
  );
}
