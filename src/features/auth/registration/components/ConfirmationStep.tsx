"use client";

import { useState } from "react";
import {
  Box,
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
  TextField,
  Typography,
} from "@mui/material";

import type { RegistrationData } from "../types";

type ConfirmationStepProps = Readonly<{
  data: RegistrationData;
  isOtpVisible: boolean;
  otp: string;
  otpError: string;
  otpRef: React.RefObject<HTMLInputElement | null>;
  termsAccepted: boolean;
  onOtpChange: (value: string) => void;
  onTermsChange: (checked: boolean) => void;
}>;

export function ConfirmationStep({
  data,
  isOtpVisible,
  otp,
  otpError,
  otpRef,
  termsAccepted,
  onOtpChange,
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
      <Box>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
          Revisa tus datos
        </Typography>
        <List disablePadding>
          {summary.map(([label, value]) => (
            <ListItem disableGutters divider key={label}>
              <ListItemText primary={label} secondary={value} />
            </ListItem>
          ))}
        </List>
      </Box>

      {!isOtpVisible && (
        <Stack spacing={0.5}>
          <Button onClick={() => setIsTermsOpen(true)} type="button" variant="text">
            Consultar términos y condiciones
          </Button>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(event) => onTermsChange(event.target.checked)}
                slotProps={{ input: { "aria-describedby": "terms-requirement" } }}
              />
            }
            label="He leído y acepto los términos y condiciones"
          />
          <Typography color="text.secondary" id="terms-requirement" variant="caption">
            Debes aceptar los términos antes de enviar el código.
          </Typography>
        </Stack>
      )}

      {isOtpVisible && (
        <Stack spacing={1}>
          <Typography color="text.secondary">
            Ingresa el código demostrativo de seis dígitos.
          </Typography>
          <TextField
            autoComplete="one-time-code"
            error={Boolean(otpError)}
            fullWidth
            helperText={otpError}
            inputRef={otpRef}
            label="Código de verificación"
            name="otp"
            onChange={(event) => {
              if (/^\d*$/.test(event.target.value)) onOtpChange(event.target.value);
            }}
            required
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
            value={otp}
          />
        </Stack>
      )}

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
            Este contenido es demostrativo. El registro no crea una cuenta, no envía información y no establece una relación contractual.
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
