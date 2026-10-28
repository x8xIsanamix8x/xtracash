"use client";

import { FormEvent, useEffect, useRef } from "react";
import {
  AddCircleOutlineRounded,
  CloseRounded,
} from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Slide,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";

import { formatDocument, formatPhone, getBank } from "../format";
import type {
  Bank,
  DetailsErrors,
  DetailsField,
  ManualRecipientData,
} from "../types";
import { BankOptionLabel } from "./BankOptionLabel";
import { paymentFieldSx } from "./paymentFieldStyle";

type AddRecipientDialogProps = Readonly<{
  banks: readonly Bank[];
  errors: DetailsErrors;
  focusField: DetailsField | null;
  focusRequest: number;
  isSubmitting: boolean;
  manualRecipient: ManualRecipientData;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  onManualChange: (
    field: keyof ManualRecipientData,
    value: string | boolean,
  ) => void;
}>;

function AddRecipientTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function AddRecipientDialog({
  banks,
  errors,
  focusField,
  focusRequest,
  isSubmitting,
  manualRecipient,
  open,
  onClose,
  onDone,
  onManualChange,
}: AddRecipientDialogProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const bankRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || focusField === null) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const fieldRefs = {
        bankCode: bankRef,
        documentNumber: documentRef,
        phone: phoneRef,
        name: nameRef,
      };
      fieldRefs[focusField as keyof typeof fieldRefs]?.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [focusField, focusRequest, open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onDone();
  };

  const selectedBank = getBank(banks, manualRecipient.bankCode);

  return (
    <Dialog
      aria-labelledby="add-recipient-title"
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      scroll="paper"
      slots={{ transition: AddRecipientTransition }}
      slotProps={{
        container: {
          sx: {
            alignItems: { xs: "flex-end", md: "center" },
            height: { xs: "100dvh", md: "100%" },
          },
        },
        paper: {
          sx: {
            m: { xs: 0, md: 2 },
            width: "100%",
            maxHeight: { xs: "88dvh", md: "82dvh" },
            borderRadius: { xs: "1.5rem 1.5rem 0 0", md: 3 },
          },
        },
      }}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
    >
      <DialogTitle
        id="add-recipient-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "secondary.main",
          fontWeight: 700,
          pr: 7,
        }}
      >
        <AddCircleOutlineRounded color="primary" />
        Agregar beneficiario
      </DialogTitle>
      <Button
        aria-label="Cerrar agregar beneficiario"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          minWidth: 44,
          width: 44,
          p: 0,
        }}
        type="button"
      >
        <CloseRounded />
      </Button>

      <Stack component="form" noValidate onSubmit={submit}>
        <DialogContent sx={{ pb: 1.5 }}>
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              Ingresa los datos de la persona a quien enviarás el pago.
            </Typography>

            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.bankCode)}
              fullWidth
              helperText={errors.bankCode}
              inputRef={bankRef}
              label="Banco destino"
              onChange={(event) => onManualChange("bankCode", event.target.value)}
              required
              select
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: () => selectedBank
                    ? <BankOptionLabel bank={selectedBank} />
                    : "Selecciona un banco",
                  MenuProps: {
                    slotProps: {
                      paper: {
                        sx: {
                          maxWidth: "calc(100vw - 32px)",
                          maxHeight: "min(420px, 60dvh)",
                        },
                      },
                    },
                  },
                },
              }}
              value={manualRecipient.bankCode}
              sx={paymentFieldSx}
            >
              <MenuItem disabled value="">Selecciona un banco</MenuItem>
              {banks.map((bank) => (
                <MenuItem key={bank.code} value={bank.code} sx={{ minHeight: "44px !important", whiteSpace: "normal" }}>
                  <BankOptionLabel bank={bank} />
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                disabled={isSubmitting}
                fullWidth
                label="Tipo de documento"
                onChange={(event) => onManualChange("documentType", event.target.value)}
                required
                select
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={manualRecipient.documentType}
                sx={paymentFieldSx}
              >
                <MenuItem value="V">V</MenuItem>
                <MenuItem value="J">J</MenuItem>
              </TextField>
              <TextField
                disabled={isSubmitting}
                error={Boolean(errors.documentNumber)}
                fullWidth
                helperText={errors.documentNumber}
                inputRef={documentRef}
                label="Número de documento"
                onChange={(event) => onManualChange(
                  "documentNumber",
                  event.target.value.replace(/\D/g, "").slice(0, 9),
                )}
                required
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { inputMode: "numeric", maxLength: 9, pattern: "[0-9]*" },
                }}
                value={manualRecipient.documentNumber}
                sx={paymentFieldSx}
              />
            </Stack>

            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.phone)}
              fullWidth
              helperText={errors.phone}
              inputRef={phoneRef}
              label="Teléfono"
              onChange={(event) => onManualChange(
                "phone",
                event.target.value.replace(/\D/g, "").slice(0, 11),
              )}
              required
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { autoComplete: "tel", inputMode: "numeric", maxLength: 11 },
              }}
              value={manualRecipient.phone}
              sx={paymentFieldSx}
            />

            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.name)}
              fullWidth
              helperText={errors.name}
              inputRef={nameRef}
              label="Nombre del beneficiario"
              onChange={(event) => onManualChange("name", event.target.value)}
              required
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={manualRecipient.name}
              sx={paymentFieldSx}
            />

            <Typography color="text.secondary" variant="caption">
              {manualRecipient.name && manualRecipient.documentNumber && manualRecipient.phone
                ? `${manualRecipient.name} · ${formatDocument(manualRecipient.documentType, manualRecipient.documentNumber)} · ${formatPhone(manualRecipient.phone)}`
                : "Todos los datos son necesarios para continuar."}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
            <Button disabled={isSubmitting} fullWidth onClick={onClose} type="button" variant="outlined">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} fullWidth type="submit" variant="contained">
              Usar beneficiario
            </Button>
          </Stack>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
