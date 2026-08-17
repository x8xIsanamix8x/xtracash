"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
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
      <Card component="section" variant="outlined" sx={{ boxShadow: "none" }}>
        <CardContent>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
            Revisa tus datos
          </Typography>
          <List disablePadding>
            {summary.map(([label, value]) => (
              <ListItem disableGutters divider key={label}>
                <ListItemText primary={label} secondary={value} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Stack spacing={0.5}>
        <Typography color="text.secondary">
          Al crear tu cuenta, recibirás en tu correo las instrucciones para verificarla.
        </Typography>
        <Button
          disabled={isSubmitting}
          onClick={() => setIsTermsOpen(true)}
          type="button"
          variant="text"
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
            />
          }
          label="He leído y acepto los términos y condiciones"
        />
        <Typography color="text.secondary" id="terms-requirement" variant="caption">
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
