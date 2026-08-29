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
  FormControl,
  FormLabel,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import type {
  RegistrationData,
  RegistrationErrors,
  RegistrationInputRefs,
  RegistrationUiField,
} from "../types";
import {
  applyPhoneNumberInput,
  doPasswordsMatch,
  isMobileOperatorCode,
  MOBILE_OPERATOR_CODES,
  passwordRules,
  PHONE_LENGTH,
  type RegistrationPhoneParts,
} from "../validation";

type ContactSecurityStepProps = Readonly<{
  data: RegistrationData;
  errors: RegistrationErrors;
  inputRefs: RegistrationInputRefs;
  onChange: (field: keyof RegistrationData, value: string) => void;
  onFieldBlur: (field: RegistrationUiField) => void;
  onPhonePartsChange: (parts: RegistrationPhoneParts) => void;
  phoneParts: RegistrationPhoneParts;
}>;

export function ContactSecurityStep({
  data,
  errors,
  inputRefs,
  onChange,
  onFieldBlur,
  onPhonePartsChange,
  phoneParts,
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
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Número de teléfono</FormLabel>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              minWidth: 0,
              mt: 1,
            }}
          >
            <TextField
              error={Boolean(errors.phoneOperatorCode)}
              helperText={errors.phoneOperatorCode}
              inputRef={inputRefs.phoneOperatorCode}
              label="Código"
              name="phoneOperatorCode"
              onBlur={() => onFieldBlur("phoneOperatorCode")}
              onChange={(event) => {
                const operatorCode = event.target.value;
                if (operatorCode === "" || isMobileOperatorCode(operatorCode)) {
                  onPhonePartsChange({ ...phoneParts, operatorCode });
                }
              }}
              required
              select
              slotProps={{
                formHelperText: errors.phoneOperatorCode ? { role: "alert" } : undefined,
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: (value) =>
                    typeof value === "string" && value ? value : "Selecciona",
                },
              }}
              sx={{ flex: { xs: "0 0 112px", sm: "0 0 128px" }, minWidth: 0 }}
              value={phoneParts.operatorCode}
            >
              <MenuItem disabled value="">
                Selecciona
              </MenuItem>
              {MOBILE_OPERATOR_CODES.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              autoComplete="tel-national"
              error={Boolean(errors.phoneLocalNumber)}
              fullWidth
              helperText={errors.phoneLocalNumber}
              inputRef={inputRefs.phoneLocalNumber}
              label="Número"
              name="phoneLocalNumber"
              onBlur={() => onFieldBlur("phoneLocalNumber")}
              onChange={(event) =>
                onPhonePartsChange(applyPhoneNumberInput(event.target.value, phoneParts))
              }
              placeholder="1234567"
              required
              slotProps={{
                formHelperText: errors.phoneLocalNumber ? { role: "alert" } : undefined,
                htmlInput: { inputMode: "numeric", maxLength: PHONE_LENGTH },
              }}
              sx={{ flex: "1 1 auto", minWidth: 0 }}
              type="tel"
              value={phoneParts.localNumber}
            />
          </Box>
        </FormControl>
        <TextField
          autoComplete="email"
          error={Boolean(errors.email)}
          fullWidth
          helperText={errors.email}
          inputRef={inputRefs.email}
          label="Correo electrónico"
          name="email"
          onBlur={() => onFieldBlur("email")}
          onChange={(event) => onChange("email", event.target.value)}
          required
          slotProps={{
            formHelperText: errors.email ? { role: "alert" } : undefined,
            htmlInput: { inputMode: "email" },
          }}
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
          onBlur={() => onFieldBlur("passwordConfirmation")}
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
