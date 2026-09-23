"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import type { RegistrationData } from "../types";

type ConfirmationStepProps = Readonly<{
  data: RegistrationData;
  isSubmitting: boolean;
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
}>;

export function ConfirmationStep({
  data,
  isSubmitting,
  termsAccepted,
  onTermsChange,
}: ConfirmationStepProps) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const summary = [
    ["Nombre", `${data.firstName.trim()} ${data.lastName.trim()}`],
    ["Identificación", `${data.nationality}-${data.documentNumber.trim()}`],
    ["Teléfono", data.phone.trim()],
    ["Correo", data.email.trim()],
  ] as const;

  return (
    <Stack spacing={2}>
      <Stack component="section" spacing={1}>
        <Typography
          component="h2"
          variant="subtitle1"
          sx={{ color: themeTokens.color.preLoginNavy, fontWeight: 700 }}
        >
          Revisa tus datos
        </Typography>
        <List disablePadding sx={{ bgcolor: "#F2F2F2", borderRadius: 3, px: 2 }}>
          {summary.map(([label, value]) => (
            <ListItem
              disableGutters
              divider
              key={label}
              sx={{ borderColor: "rgba(0, 0, 75, 0.08)" }}
            >
              <ListItemText
                primary={label}
                secondary={value}
                slotProps={{
                  primary: { sx: { color: themeTokens.color.preLoginMuted, fontSize: "0.8125rem" } },
                  secondary: { sx: { color: themeTokens.color.preLoginNavy, fontWeight: 500 } },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Stack>

      <Stack spacing={0.5}>
        <Typography sx={{ color: themeTokens.color.preLoginMuted, fontSize: "0.875rem" }}>
          Al crear tu cuenta, recibirás en tu correo las instrucciones para verificarla.
        </Typography>
        <Button
          disabled={isSubmitting}
          onClick={() => setIsTermsOpen(true)}
          type="button"
          variant="text"
          sx={{ alignSelf: "flex-start", px: 0, color: themeTokens.color.preLoginPrimary, fontWeight: 500 }}
        >
          Consultar términos y condiciones
        </Button>
        <FormControlLabel
          control={
            <Checkbox
              checked={termsAccepted}
              disabled={isSubmitting}
              onChange={(event) => onTermsChange(event.target.checked)}
              slotProps={{ input: { "aria-describedby": "terms-requirement" } }}
              sx={{
                color: themeTokens.color.preLoginMuted,
                "&.Mui-checked": { color: themeTokens.color.preLoginPrimary },
              }}
            />
          }
          label="He leído y acepto los términos y condiciones"
          sx={{ color: themeTokens.color.preLoginNavy }}
        />
        <Typography sx={{ color: themeTokens.color.preLoginMuted }} id="terms-requirement" variant="caption">
          Debes aceptar los términos antes de crear tu cuenta.
        </Typography>
      </Stack>

      <Dialog
        aria-describedby="registration-terms-description"
        aria-labelledby="registration-terms-title"
        fullWidth
        maxWidth="sm"
        onClose={() => setIsTermsOpen(false)}
        open={isTermsOpen}
      >
        <DialogTitle id="registration-terms-title">Términos y condiciones</DialogTitle>
        <DialogContent>
          <DialogContentText id="registration-terms-description">
            Los términos y condiciones definitivos están pendientes de publicación por Producto y Legal.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTermsOpen(false)} type="button" variant="contained">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
