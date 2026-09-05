"use client";

import {
  FormEvent,
  Ref,
  useEffect,
  useRef,
} from "react";
import {
  AccountBalanceRounded,
  ChevronRightRounded,
  ContactsRounded,
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

import { APP_BOTTOM_NAVIGATION_HEIGHT } from "@/components/AppBottomNavigation";

import {
  formatAmountInput,
  formatAmountOnBlur,
  formatBank,
  formatDocument,
  formatPhone,
  getBank,
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
import { BankOptionLabel } from "./BankOptionLabel";

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
  titleRef: Ref<HTMLHeadingElement>;
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
  titleRef,
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
      <Stack spacing={{ xs: 2, sm: 3 }}>
        <Stack spacing={1}>
          {recipientMode !== "choice" && (
            <Typography color="text.secondary" variant="body2">
              Paso 1 de 2
            </Typography>
          )}
          <Typography
            component="h1"
            id="mobile-payment-details-title"
            ref={titleRef}
            tabIndex={-1}
            sx={{
              color: "secondary.main",
              fontSize: recipientMode === "choice"
                ? { xs: "clamp(1.25rem, 6vw, 1.75rem)", sm: "2rem" }
                : { xs: "clamp(1.875rem, 9vw, 2rem)", sm: "2.25rem" },
              fontWeight: 700,
              letterSpacing: recipientMode === "choice" ? "-0.025em" : undefined,
              lineHeight: 1.12,
              whiteSpace: recipientMode === "choice" ? "nowrap" : "normal",
            }}
          >
            {recipientMode === "choice"
              ? "¿A quién enviarás el pago?"
              : "Datos del destinatario"}
          </Typography>
          <Typography color="text.secondary">
            {recipientMode === "choice"
              ? "Elige cómo agregar al destinatario."
              : "Completa sus datos y define el monto."}
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
                sx={{ minHeight: 112, height: "100%", p: 2 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box
                    aria-hidden="true"
                    sx={(theme) => ({
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 1.5,
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    })}
                  >
                    <PersonAddAltRounded />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      Nuevo destinatario
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Completa sus datos para realizar el pago.
                    </Typography>
                  </Box>
                  <ChevronRightRounded aria-hidden="true" color="primary" />
                </Stack>
              </CardActionArea>
            </Card>
            <Card variant="outlined">
              <CardActionArea
                onClick={onOpenDirectory}
                sx={{ minHeight: 112, height: "100%", p: 2 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box
                    aria-hidden="true"
                    sx={(theme) => ({
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 1.5,
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    })}
                  >
                    <ContactsRounded />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      Destinatario guardado
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Elige uno de tu directorio.
                    </Typography>
                  </Box>
                  <ChevronRightRounded aria-hidden="true" color="primary" />
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
                Destinatario
              </Typography>
              <Button
                disabled={isSubmitting}
                onClick={onChangeRecipient}
                type="button"
                variant="text"
              >
                Cambiar
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
              sx={{
                minWidth: 0,
                "& .MuiSelect-select": {
                  minHeight: "44px !important",
                  display: "flex",
                  alignItems: "center",
                  boxSizing: "border-box",
                  py: 1.25,
                  pr: "40px !important",
                  whiteSpace: "normal !important",
                  overflow: "visible",
                },
              }}
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: (value) => {
                    const selectedBankOption = getBank(
                      banks,
                      String(value),
                    );

                    return selectedBankOption
                      ? <BankOptionLabel bank={selectedBankOption} />
                      : "Selecciona un banco";
                  },
                  MenuProps: {
                    slotProps: {
                      paper: {
                        sx: {
                          width: "auto",
                          maxWidth: "calc(100vw - 32px)",
                          maxHeight: "min(420px, 70dvh)",
                          overflowX: "hidden",
                        },
                      },
                    },
                  },
                },
              }}
              value={manualRecipient.bankCode}
            >
              <MenuItem disabled value="">
                Selecciona un banco
              </MenuItem>
              {banks.map((bank) => (
                <MenuItem
                  key={bank.code}
                  value={bank.code}
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    minHeight: "44px !important",
                    height: "auto",
                    alignItems: "flex-start",
                    py: 1.25,
                    whiteSpace: "normal",
                    overflow: "hidden",
                  }}
                >
                  <BankOptionLabel bank={bank} />
                </MenuItem>
              ))}
            </TextField>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: 1.5,
                alignItems: "start",
                "@media (min-width: 400px)": {
                  gridTemplateColumns: "152px minmax(0, 1fr)",
                },
              }}
            >
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
                sx={{ width: "100%" }}
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
                  inputLabel: { shrink: true },
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 9,
                    pattern: "[0-9]*",
                  },
                }}
                type="text"
                value={manualRecipient.documentNumber}
              />
            </Box>

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
                py: 0.5,
                px: 1,
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
                label={(
                  <Box sx={{ py: 0.5 }}>
                    <Typography>Guardar en mi directorio</Typography>
                    <Typography color="text.secondary" variant="caption">
                      Se guardará cuando el pago se complete.
                    </Typography>
                  </Box>
                )}
                sx={{ m: 0, width: "100%", minHeight: 48 }}
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
                    Destinatario
                  </Typography>
                  <Button
                    onClick={onChangeRecipient}
                    type="button"
                    variant="text"
                  >
                    Cambiar
                  </Button>
                </Stack>
                <Typography sx={{ fontWeight: 700 }}>
                  {selectedContact.name}
                </Typography>
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
                  {formatPhone(selectedContact.phone)} ·{" "}
                  {formatDocument(
                    selectedContact.documentType,
                    selectedContact.documentNumber,
                  )}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        )}

        {recipientMode !== "choice" && (
          <Stack spacing={1.25}>
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
                  style: {
                    fontSize: "1.5rem",
                    fontWeight: 700,
                  },
                },
              }}
              value={amount}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={(theme) => ({
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.07),
              })}
            >
              <Typography color="text.secondary" variant="body2">
                Disponible utilizable
              </Typography>
              <Typography sx={{ color: "secondary.main", fontWeight: 700 }}>
                {availableLabel}
              </Typography>
            </Stack>
          </Stack>
        )}
      </Stack>

      {recipientMode !== "choice" && (
        <Box
          sx={{
            position: { xs: "sticky", md: "static" },
            zIndex: 2,
            bottom: {
              xs: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT}px + env(safe-area-inset-bottom))`,
              md: "auto",
            },
            mt: "auto",
            pt: 3,
            pb: 1.5,
            bgcolor: "background.default",
          }}
        >
          <Button
            disabled={isSubmitting}
            fullWidth
            type="submit"
            variant="contained"
          >
            {isSubmitting ? "Preparando pago…" : "Revisar pago"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
