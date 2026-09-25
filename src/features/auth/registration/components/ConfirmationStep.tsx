"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import type { RegistrationData } from "../types";
import { TermsAndConditionsContent } from "./TermsAndConditionsContent";

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
        <Stack direction="row" sx={{ alignItems: "flex-start", ml: -1 }}>
          <Checkbox
            checked={termsAccepted}
            disabled={isSubmitting}
            id="registration-terms-accepted"
            onChange={(event) => onTermsChange(event.target.checked)}
            required
            slotProps={{
              input: {
                "aria-describedby": "terms-requirement",
                "aria-label": "Acepto los términos y condiciones",
              },
            }}
            sx={{
              color: themeTokens.color.preLoginMuted,
              "&.Mui-checked": { color: themeTokens.color.preLoginPrimary },
            }}
          />
          <Box sx={{ minWidth: 0, pt: "9px" }}>
            <Typography
              component="label"
              htmlFor="registration-terms-accepted"
              sx={{ color: themeTokens.color.preLoginNavy, cursor: "pointer" }}
            >
              Acepto los{" "}
            </Typography>
            <Button
              aria-controls={isTermsOpen ? "registration-terms-dialog" : undefined}
              aria-expanded={isTermsOpen}
              aria-haspopup="dialog"
              disabled={isSubmitting}
              onClick={() => setIsTermsOpen(true)}
              type="button"
              variant="text"
              sx={{
                minWidth: 0,
                p: 0,
                color: themeTokens.color.preLoginPrimary,
                fontSize: "1rem",
                fontWeight: 600,
                lineHeight: "inherit",
                textTransform: "none",
                verticalAlign: "baseline",
              }}
            >
              términos y condiciones
            </Button>
          </Box>
        </Stack>
        <Typography sx={{ color: themeTokens.color.preLoginMuted }} id="terms-requirement" variant="caption">
          Debes aceptar los términos antes de crear tu cuenta.
        </Typography>
      </Stack>

      <Dialog
        aria-describedby="registration-terms-description"
        aria-labelledby="registration-terms-title"
        fullWidth
        id="registration-terms-dialog"
        maxWidth="md"
        onClose={() => setIsTermsOpen(false)}
        open={isTermsOpen}
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              maxHeight: "calc(100dvh - 32px)",
            },
          },
        }}
      >
        <DialogTitle
          id="registration-terms-title"
          sx={{ color: themeTokens.color.preLoginNavy, fontWeight: 800, pb: 1.5 }}
        >
          Términos y condiciones
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            bgcolor: "#F8F8FD",
            borderColor: "rgba(0, 0, 75, 0.1)",
            px: { xs: 2, sm: 3 },
            py: { xs: 2.5, sm: 3 },
          }}
        >
          <TermsAndConditionsContent />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(0, 0, 75, 0.08)", p: 2 }}>
          <Button
            onClick={() => setIsTermsOpen(false)}
            type="button"
            variant="contained"
            sx={{
              borderRadius: "999px",
              bgcolor: themeTokens.color.preLoginPrimary,
              px: 3,
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
