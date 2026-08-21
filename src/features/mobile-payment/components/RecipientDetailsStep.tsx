"use client";

import {
  FormEvent,
  useEffect,
  useRef,
} from "react";
import {
  AccountBalanceRounded,
  ContactsRounded,
  EditRounded,
  PersonAddAltRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  formatAmountInput,
  formatAmountOnBlur,
  getBank,
  formatBank,
  parseAmountToMinorUnits,
} from "../format";
import type {
  Bank,
  DetailsErrors,
  DetailsField,
  DirectoryContact,
  ManualRecipientData,
  RecipientMode,
} from "../types";

type RecipientDetailsStepProps = Readonly<{
  amount: string;
  availableLabel: string;
  banks: readonly Bank[];
  errors: DetailsErrors;
  focusField: DetailsField | null;
  focusRequest: number;
  isSubmitting: boolean;
  manualRecipient: ManualRecipientData;
  recipientMode: RecipientMode;
  selectedContact: DirectoryContact | null;
  onAmountChange: (
    value: string,
    minorUnits: number | null,
  ) => void;
  onChooseManual: () => void;
  onChangeRecipient: () => void;
  onContinue: () => void;
  onManualChange: (
    field: keyof ManualRecipientData,
    value: string | boolean,
  ) => void;
  onOpenDirectory: () => void;
}>;

export function RecipientDetailsStep({
  amount,
  availableLabel,
  banks,
  errors,
  focusField,
  focusRequest,
  isSubmitting,
  manualRecipient,
  recipientMode,
  selectedContact,
  onAmountChange,
  onChooseManual,
  onChangeRecipient,
  onContinue,
  onManualChange,
  onOpenDirectory,
}: RecipientDetailsStepProps) {
  const manualChoiceRef = useRef<HTMLButtonElement>(null);
  const bankRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fieldRefs = {
      recipient: manualChoiceRef,
      bankCode: bankRef,
      documentNumber: documentRef,
      phone: phoneRef,
      name: nameRef,
      amount: amountRef,
    };

    if (focusField !== null) {
      fieldRefs[focusField].current?.focus();
    }
  }, [focusField, focusRequest]);

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue();
  };

  const updateAmount = (
    rawValue: string,
    input: HTMLInputElement | HTMLTextAreaElement,
  ) => {
    const selectionStart = input.selectionStart ?? rawValue.length;
    const wasAtEnd = selectionStart === rawValue.length;
    const distanceFromEnd = rawValue.length - selectionStart;
    const formattedValue = formatAmountInput(rawValue);

    onAmountChange(
      formattedValue,
      parseAmountToMinorUnits(formattedValue),
    );

    window.requestAnimationFrame(() => {
      const nextCaretPosition = wasAtEnd
        ? formattedValue.length
        : Math.max(0, formattedValue.length - distanceFromEnd);

      input.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const completeAmountFormat = () => {
    const formattedValue = formatAmountOnBlur(amount);

    onAmountChange(
      formattedValue,
      parseAmountToMinorUnits(formattedValue),
    );
  };

  const selectedBank = selectedContact
    ? getBank(banks, selectedContact.bankCode)
    : undefined;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submitDetails}
      sx={{
        minHeight: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography color="text.secondary" variant="body2">
            Paso 1 de 2
          </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{ color: "secondary.main", fontWeight: 700 }}
          >
            ¿A quién deseas enviar?
          </Typography>
          <Typography color="text.secondary">
            Ingresa los datos del destinatario y el monto de la solicitud.
          </Typography>
        </Stack>

        {recipientMode === "choice" && (
          <Box
            aria-describedby={
              errors.recipient ? "recipient-choice-error" : undefined
            }
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            }}
          >
            <Card variant="outlined">
              <CardActionArea
                onClick={onChooseManual}
                ref={manualChoiceRef}
                sx={{ minHeight: 132, p: 2 }}
              >
                <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
                  <PersonAddAltRounded color="primary" />
                  <Typography sx={{ fontWeight: 700 }}>
                    Ingresar destinatario nuevo
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Completa sus datos bancarios.
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
            <Card variant="outlined">
              <CardActionArea
                onClick={onOpenDirectory}
                sx={{ minHeight: 132, p: 2 }}
              >
                <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
                  <ContactsRounded color="primary" />
                  <Typography sx={{ fontWeight: 700 }}>
                    Elegir del directorio
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Busca entre tus contactos guardados.
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
            {errors.recipient && (
              <Typography
                color="error"
                id="recipient-choice-error"
                role="alert"
                variant="caption"
                sx={{ gridColumn: "1 / -1" }}
              >
                {errors.recipient}
              </Typography>
            )}
          </Box>
        )}

        {recipientMode === "manual" && (
          <Stack spacing={2}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "space-between",
              }}
            >
              <Typography
                component="h2"
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                Destinatario nuevo
              </Typography>
              <Button
                disabled={isSubmitting}
                onClick={onChangeRecipient}
                startIcon={<EditRounded />}
                type="button"
                variant="text"
              >
                Cambiar destinatario
              </Button>
            </Stack>

            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.bankCode)}
              fullWidth
              helperText={errors.bankCode}
              inputRef={bankRef}
              label="Banco destino"
              name="bankCode"
              onChange={(event) => onManualChange(
                "bankCode",
                event.target.value,
              )}
              required
              select
              slotProps={{
                inputLabel: { shrink: true },
                select: { displayEmpty: true },
              }}
              value={manualRecipient.bankCode}
            >
              <MenuItem disabled value="">
                Selecciona un banco
              </MenuItem>
              {banks.map((bank) => (
                <MenuItem key={bank.code} value={bank.code}>
                  {formatBank(bank)}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={1.5}>
              <TextField
                disabled={isSubmitting}
                label="Tipo de documento"
                name="documentType"
                onChange={(event) => onManualChange(
                  "documentType",
                  event.target.value,
                )}
                required
                select
                value={manualRecipient.documentType}
                sx={{ width: 104, flexShrink: 0 }}
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
                name="documentNumber"
                onChange={(event) => onManualChange(
                  "documentNumber",
                  event.target.value.replace(/\D/g, "").slice(0, 9),
                )}
                required
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 9,
                    pattern: "[0-9]*",
                  },
                }}
                type="text"
                value={manualRecipient.documentNumber}
              />
            </Stack>

            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.phone)}
              fullWidth
              helperText={errors.phone}
              inputRef={phoneRef}
              label="Teléfono"
              name="phone"
              onChange={(event) => onManualChange(
                "phone",
                event.target.value.replace(/\D/g, "").slice(0, 11),
              )}
              required
              slotProps={{
                htmlInput: {
                  autoComplete: "tel",
                  inputMode: "numeric",
                  maxLength: 11,
                },
              }}
              value={manualRecipient.phone}
            />

            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.name)}
              fullWidth
              helperText={errors.name}
              inputRef={nameRef}
              label="Nombre del destinatario"
              name="name"
              onChange={(event) => onManualChange(
                "name",
                event.target.value,
              )}
              required
              value={manualRecipient.name}
            />

            <Box
              sx={(theme) => ({
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              })}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={manualRecipient.saveToDirectory}
                    disabled={isSubmitting}
                    onChange={(event) => onManualChange(
                      "saveToDirectory",
                      event.target.checked,
                    )}
                  />
                }
                label="Guardar en mi directorio al completar el pago"
              />
            </Box>
          </Stack>
        )}

        {recipientMode === "directory" && selectedContact && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    component="h2"
                    variant="h6"
                    sx={{ color: "secondary.main", fontWeight: 700 }}
                  >
                    {selectedContact.name}
                  </Typography>
                  <Button
                    onClick={onChangeRecipient}
                    type="button"
                    variant="text"
                  >
                    Cambiar destinatario
                  </Button>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <AccountBalanceRounded color="primary" fontSize="small" />
                  <Typography color="text.secondary" variant="body2">
                    {selectedBank ? formatBank(selectedBank) : "Banco no disponible"}
                  </Typography>
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {selectedContact.phone} ·{" "}
                  {selectedContact.documentType}-
                  {selectedContact.documentNumber}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        )}

        {recipientMode !== "choice" && (
          <Stack spacing={1}>
            <Typography
              component="h2"
              variant="h6"
              sx={{ color: "secondary.main", fontWeight: 700 }}
            >
              Monto
            </Typography>
            <TextField
              disabled={isSubmitting}
              error={Boolean(errors.amount)}
              fullWidth
              helperText={errors.amount}
              inputRef={amountRef}
              label="Monto a enviar"
              name="amount"
              onBlur={completeAmountFormat}
              onChange={(event) => updateAmount(
                event.target.value,
                event.target,
              )}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      Bs.
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  inputMode: "decimal",
                },
              }}
              value={amount}
            />
            <Typography color="text.secondary" variant="body2">
              Disponible utilizable: {availableLabel}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              El monto y el disponible serán validados antes de confirmar.
            </Typography>
          </Stack>
        )}
      </Stack>

      <Box sx={{ mt: "auto", pt: 3 }}>
        <Button
          disabled={recipientMode === "choice" || isSubmitting}
          fullWidth
          type="submit"
          variant="contained"
        >
          {isSubmitting ? "Preparando solicitud…" : "Revisar solicitud"}
        </Button>
      </Box>
    </Box>
  );
}
