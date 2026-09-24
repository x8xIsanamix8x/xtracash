"use client";

import {
  FormEvent,
  useEffect,
  useRef,
} from "react";
import {
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
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

import { getMobilePaymentRestrictionMessage } from "../accessStatus";
import {
  formatAmountInput,
  formatAmountOnBlur,
  getBank,
  parseAmountToMinorUnits,
} from "../format";
import { maxPaymentConceptLength } from "../paymentPurpose";
import type {
  Bank,
  DetailsErrors,
  DetailsField,
  DirectoryContact,
  ManualRecipientData,
  MobilePaymentAccessStatus,
  PaymentIconId,
  RecipientMode,
} from "../types";
import { BankOptionLabel } from "./BankOptionLabel";
import { PaymentIconSelector } from "./PaymentIconSelector";
import { paymentFieldSx } from "./paymentFieldStyle";

type RecipientDetailsStepProps = Readonly<{
  amount: string;
  accessStatus: MobilePaymentAccessStatus;
  availableLabel: string;
  banks: readonly Bank[];
  concept: string;
  contacts: readonly DirectoryContact[];
  errors: DetailsErrors;
  focusField: DetailsField | null;
  focusRequest: number;
  isSubmitting: boolean;
  isPreview: boolean;
  manualRecipient: ManualRecipientData;
  recipientMode: RecipientMode;
  selectedContact: DirectoryContact | null;
  selectedIcon: PaymentIconId | null;
  submitError: string;
  onAmountChange: (
    value: string,
    minorUnits: number | null,
  ) => void;
  onChangeRecipient: () => void;
  onConceptChange: (value: string) => void;
  onContinue: () => void;
  onManualChange: (
    field: keyof ManualRecipientData,
    value: string | boolean,
  ) => void;
  onOpenDirectory: () => void;
  onSelectContact: (contactId: string) => void;
  onSelectIcon: (icon: PaymentIconId | null) => void;
}>;

export function RecipientDetailsStep({
  amount,
  accessStatus,
  availableLabel,
  banks,
  concept,
  contacts,
  errors,
  focusField,
  focusRequest,
  isSubmitting,
  isPreview,
  manualRecipient,
  recipientMode,
  selectedContact,
  selectedIcon,
  submitError,
  onAmountChange,
  onChangeRecipient,
  onConceptChange,
  onContinue,
  onManualChange,
  onOpenDirectory,
  onSelectContact,
  onSelectIcon,
}: RecipientDetailsStepProps) {
  const recipientListRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const hasRecipientData = recipientMode !== "choice"
    || Boolean(manualRecipient.bankCode || manualRecipient.documentNumber
      || manualRecipient.phone || manualRecipient.name);
  const accessCopy = accessStatus === "active"
    ? {
      label: "Disponible",
      indicatorColor: "#32D74B",
    }
    : accessStatus === "suspended"
      ? {
        label: "Suspendido",
        indicatorColor: "#FFD60A",
      }
      : {
        label: "Bloqueado",
        indicatorColor: "#FF453A",
      };
  const restrictionMessage = getMobilePaymentRestrictionMessage(accessStatus);

  useEffect(() => {
    const fieldRefs = {
      recipient: recipientListRef,
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

    if (accessStatus !== "active") {
      return;
    }

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

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submitDetails}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack sx={{ gap: "2.1875rem", flex: 1 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            bgcolor: "secondary.main",
            color: "common.white",
          }}
        >
          <CardContent sx={{ px: 2, py: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontSize: 13, display: "flex", alignItems: "center", gap: 0.75 }}>
                {accessCopy.label}
                <Box
                  aria-hidden="true"
                  component="span"
                  sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: accessCopy.indicatorColor }}
                />
              </Typography>
              {isPreview && (
                <Typography sx={{ color: "#FFD4AA", fontSize: 11, fontWeight: 600 }}>
                  Datos de ejemplo
                </Typography>
              )}
            </Stack>
            <Typography sx={{ mt: 0.5, fontSize: { xs: 26, sm: 32 }, fontWeight: 700, lineHeight: 1.1 }}>
              {availableLabel}
            </Typography>
          </CardContent>
        </Card>

        {restrictionMessage && (
          <Alert
            aria-live="assertive"
            role="alert"
            severity={accessStatus === "blocked" ? "error" : "warning"}
          >
            {restrictionMessage}
          </Alert>
        )}

        <Box>
          <Typography component="h2" sx={{ px: 2, color: "secondary.main", fontSize: 15, fontWeight: 600 }}>
            Selecciona un beneficiario
          </Typography>
          <Box
            aria-describedby={errors.recipient ? "recipient-choice-error" : undefined}
            aria-label="Beneficiarios guardados"
            ref={recipientListRef}
            role="group"
            tabIndex={-1}
            sx={{
              display: "flex",
              gap: 1.5,
              mt: 1,
              px: 2,
              pt: "0.5rem",
              pb: "0.75rem",
              overflowX: "auto",
              overscrollBehaviorX: "contain",
              scrollSnapType: "x proximity",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
            }}
          >
            <Button
              aria-label="Buscar beneficiarios"
              disabled={isSubmitting}
              onClick={onOpenDirectory}
              sx={{
                flex: "0 0 64px",
                minWidth: 64,
                minHeight: 70,
                p: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                color: "secondary.main",
                scrollSnapAlign: "start",
              }}
              type="button"
              variant="text"
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "common.white",
                }}
              >
                <SearchRounded fontSize="small" />
              </Box>
              <Typography component="span" sx={{ fontSize: 11, lineHeight: 1.2, textTransform: "none" }}>
                Buscar
              </Typography>
            </Button>
            {contacts.map((contact) => {
              const selected = recipientMode === "directory" && selectedContact?.id === contact.id;
              const firstName = contact.name.trim().split(/\s+/)[0] || contact.name;
              return (
                <Button
                  aria-label={`Seleccionar a ${contact.name}`}
                  aria-pressed={selected}
                  disabled={isSubmitting}
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  sx={{
                    flex: "0 0 64px",
                    minWidth: 64,
                    minHeight: 70,
                    p: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    color: "secondary.main",
                    scrollSnapAlign: "start",
                  }}
                  type="button"
                  variant="text"
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      bgcolor: selected ? "#FF7900" : "primary.main",
                      color: "common.white",
                      fontSize: 17,
                      fontWeight: 700,
                      boxShadow: selected ? "0 0 0 3px #fff, 0 0 0 5px #FF7900" : "none",
                    }}
                  >
                    {firstName.charAt(0).toLocaleUpperCase("es")}
                  </Box>
                  <Typography
                    component="span"
                    sx={{
                      width: "100%",
                      color: selected ? "secondary.main" : "text.secondary",
                      fontSize: 11,
                      lineHeight: 1.2,
                      textAlign: "center",
                      textTransform: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {firstName}
                  </Typography>
                </Button>
              );
            })}
            {contacts.length === 0 && (
              <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
                Aún no tienes beneficiarios guardados. Puedes agregar uno nuevo.
              </Typography>
            )}
          </Box>
          {errors.recipient && (
            <Typography color="error" id="recipient-choice-error" role="alert" sx={{ px: 2 }} variant="caption">
              {errors.recipient}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: "2rem 2rem 0 0",
            bgcolor: "common.white",
            boxShadow: "0 0 1.25rem rgba(2, 0, 77, 0.08)",
          }}
        >
          <Stack spacing={2} sx={{ p: 2, pb: 0 }}>
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
                Datos del beneficiario
              </Typography>
              {hasRecipientData && (
                <Button
                  disabled={isSubmitting}
                  onClick={onChangeRecipient}
                  type="button"
                  variant="text"
                >
                  Limpiar
                </Button>
              )}
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
              size="small"
              sx={paymentFieldSx}
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
                name="documentNumber"
                onChange={(event) => onManualChange(
                  "documentNumber",
                  event.target.value.replace(/\D/g, "").slice(0, 9),
                )}
                required
                size="small"
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
                sx={paymentFieldSx}
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
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  autoComplete: "tel",
                  inputMode: "numeric",
                  maxLength: 11,
                },
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
              label="Nombre del destinatario"
              name="name"
              onChange={(event) => onManualChange(
                "name",
                event.target.value,
              )}
              required
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={manualRecipient.name}
              sx={paymentFieldSx}
            />

            {recipientMode !== "directory" && (
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
            )}
          </Stack>

        <Card
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: 0,
            bgcolor: "transparent",
          }}
        >
          <CardContent sx={{ flex: 1, p: 2, "&:last-child": { pb: 2 } }}>
            <Stack spacing={1.5}>
              <TextField
                disabled={isSubmitting}
                error={Boolean(errors.amount)}
                fullWidth
                helperText={errors.amount}
                inputRef={amountRef}
                label="Monto a enviar"
                name="amount"
                onBlur={completeAmountFormat}
                onChange={(event) => updateAmount(event.target.value, event.target)}
                placeholder="0,00"
                required
                size="small"
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  },
                  inputLabel: { shrink: true },
                  htmlInput: { inputMode: "decimal" },
                }}
                sx={paymentFieldSx}
                value={amount}
              />
              <TextField
                disabled={isSubmitting}
                fullWidth
                label="Concepto"
                name="concept"
                onChange={(event) => onConceptChange(event.target.value)}
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: maxPaymentConceptLength },
                }}
                sx={paymentFieldSx}
                value={concept}
              />
              <PaymentIconSelector
                disabled={isSubmitting}
                onSelect={onSelectIcon}
                selectedIcon={selectedIcon}
              />
              {submitError && (
                <Alert aria-live="assertive" role="alert" severity="error">
                  {submitError}
                </Alert>
              )}
              <Button
                disabled={isSubmitting || accessStatus !== "active"}
                fullWidth
                sx={{ borderRadius: 8, minHeight: 48 }}
                type="submit"
                variant="contained"
              >
                {isSubmitting ? "Preparando pago…" : "Continuar"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
        </Box>
      </Stack>
    </Box>
  );
}
