"use client";

import { FormEvent, useEffect, useRef } from "react";
import {
  AccountBalanceRounded,
  AddRounded,
  PersonOutlineRounded,
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
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { PrimaryFinancialCard } from "@/components/PrimaryFinancialCard";
import { getMobilePaymentRestrictionMessage } from "../accessStatus";
import {
  formatAmountInput,
  formatAmountOnBlur,
  formatDocument,
  formatPhone,
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
  onAmountChange: (value: string, minorUnits: number | null) => void;
  onChangeRecipient: () => void;
  onConceptChange: (value: string) => void;
  onContinue: () => void;
  onManualChange: (
    field: keyof ManualRecipientData,
    value: string | boolean,
  ) => void;
  onOpenAddRecipient: () => void;
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
  onOpenAddRecipient,
  onOpenDirectory,
  onSelectContact,
  onSelectIcon,
}: RecipientDetailsStepProps) {
  const recipientListRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const accessCopy = accessStatus === "active"
    ? { label: "Disponible", indicatorColor: "#32D74B" }
    : accessStatus === "suspended"
      ? { label: "Suspendido", indicatorColor: "#FFD60A" }
      : { label: "Bloqueado", indicatorColor: "#FF453A" };
  const restrictionMessage = getMobilePaymentRestrictionMessage(accessStatus);
  const recipientBank = getBank(banks, manualRecipient.bankCode);
  const recipientInitial = (manualRecipient.name.trim().charAt(0) || "?")
    .toLocaleUpperCase("es");

  useEffect(() => {
    if (focusField === null) return;
    if (focusField === "bankCode" || focusField === "documentNumber"
      || focusField === "phone" || focusField === "name") {
      onOpenAddRecipient();
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      if (focusField === "recipient") recipientListRef.current?.focus();
      if (focusField === "amount") amountRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [focusField, focusRequest, onOpenAddRecipient]);

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (accessStatus === "active") onContinue();
  };

  const updateAmount = (
    rawValue: string,
    input: HTMLInputElement | HTMLTextAreaElement,
  ) => {
    const selectionStart = input.selectionStart ?? rawValue.length;
    const wasAtEnd = selectionStart === rawValue.length;
    const distanceFromEnd = rawValue.length - selectionStart;
    const formattedValue = formatAmountInput(rawValue);
    onAmountChange(formattedValue, parseAmountToMinorUnits(formattedValue));

    window.requestAnimationFrame(() => {
      const nextCaretPosition = wasAtEnd
        ? formattedValue.length
        : Math.max(0, formattedValue.length - distanceFromEnd);
      input.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const completeAmountFormat = () => {
    const formattedValue = formatAmountOnBlur(amount);
    onAmountChange(formattedValue, parseAmountToMinorUnits(formattedValue));
  };

  return (
    <Box component="form" noValidate onSubmit={submitDetails} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Stack sx={{ gap: "2.1875rem", flex: 1 }}>
        <PrimaryFinancialCard labelledBy="mobile-payment-available-title">
          <Stack spacing={0.5} sx={{ alignItems: "flex-start", textAlign: "left" }}>
            <Stack direction="row" sx={{ width: "100%", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography id="mobile-payment-available-title" sx={{ display: "flex", alignItems: "center", gap: 0.75, fontWeight: 700 }}>
                {accessCopy.label}
                <Box aria-hidden="true" component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: accessCopy.indicatorColor }} />
              </Typography>
              {isPreview && <Typography sx={{ color: "#FFD4AA", fontSize: 11, fontWeight: 600 }}>Datos de ejemplo</Typography>}
            </Stack>
            <Typography sx={{ fontSize: "clamp(1.875rem, 9vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1, overflowWrap: "anywhere" }}>
              {availableLabel}
            </Typography>
          </Stack>
        </PrimaryFinancialCard>

        {restrictionMessage && <Alert aria-live="assertive" role="alert" severity={accessStatus === "blocked" ? "error" : "warning"}>{restrictionMessage}</Alert>}

        <Box>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2 }}>
            <Typography component="h2" sx={{ color: "secondary.main", fontSize: 15, fontWeight: 600 }}>Beneficiario</Typography>
            <IconButton aria-label="Agregar beneficiario" disabled={isSubmitting} onClick={onOpenAddRecipient} size="small" sx={{ color: "primary.main" }}>
              <AddRounded />
            </IconButton>
          </Stack>
          <Box aria-describedby={errors.recipient ? "recipient-choice-error" : undefined} aria-label="Beneficiarios guardados" ref={recipientListRef} role="group" tabIndex={-1} sx={{ display: "flex", gap: 1.5, mt: 1, px: 2, pt: "0.5rem", pb: "0.75rem", overflowX: "auto", overscrollBehaviorX: "contain", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}>
            <Button aria-label="Buscar beneficiarios" disabled={isSubmitting} onClick={onOpenDirectory} sx={{ flex: "0 0 64px", minWidth: 64, minHeight: 70, p: 0, display: "flex", flexDirection: "column", gap: 0.75, color: "secondary.main", scrollSnapAlign: "start" }} type="button" variant="text">
              <Box aria-hidden="true" sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "primary.main", color: "common.white" }}><SearchRounded fontSize="small" /></Box>
              <Typography component="span" sx={{ fontSize: 11, lineHeight: 1.2, textTransform: "none" }}>Buscar</Typography>
            </Button>

            {contacts.map((contact) => {
              const selected = recipientMode === "directory" && selectedContact?.id === contact.id;
              const firstName = contact.name.trim().split(/\s+/)[0] || contact.name;
              return (
                <Button aria-label={`Seleccionar a ${contact.name}`} aria-pressed={selected} disabled={isSubmitting} key={contact.id} onClick={() => onSelectContact(contact.id)} sx={{ flex: "0 0 64px", minWidth: 64, minHeight: 70, p: 0, display: "flex", flexDirection: "column", gap: 0.75, color: "secondary.main", scrollSnapAlign: "start" }} type="button" variant="text">
                  <Box aria-hidden="true" sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: selected ? "#FF7900" : "primary.main", color: "common.white", fontSize: 17, fontWeight: 700, boxShadow: selected ? "0 0 0 3px #fff, 0 0 0 5px #FF7900" : "none" }}>{firstName.charAt(0).toLocaleUpperCase("es")}</Box>
                  <Typography component="span" sx={{ width: "100%", color: selected ? "secondary.main" : "text.secondary", fontSize: 11, lineHeight: 1.2, textAlign: "center", textTransform: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</Typography>
                </Button>
              );
            })}

          </Box>
          {errors.recipient && <Typography color="error" id="recipient-choice-error" role="alert" sx={{ px: 2 }} variant="caption">{errors.recipient}</Typography>}
        </Box>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: "2rem 2rem 0 0", bgcolor: "common.white", boxShadow: "0 0 1.25rem rgba(2, 0, 77, 0.08)" }}>
          <Stack spacing={2} sx={{ p: 2, pb: 0 }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>{recipientMode === "manual" ? "Nuevo beneficiario" : "Beneficiario seleccionado"}</Typography>
              {recipientMode !== "choice" && <Button disabled={isSubmitting} onClick={recipientMode === "manual" ? onOpenAddRecipient : onChangeRecipient} type="button" variant="text">{recipientMode === "manual" ? "Editar" : "Cambiar"}</Button>}
            </Stack>

            {recipientMode === "choice" ? (
              <Typography color="text.secondary" variant="body2">Selecciona un beneficiario guardado o agrega uno nuevo para continuar.</Typography>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 3, bgcolor: "#F4F5F8" }}>
                <Box aria-hidden="true" sx={{ width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "primary.main", color: "common.white", fontSize: 17, fontWeight: 700 }}>{recipientMode === "directory" ? recipientInitial : <PersonOutlineRounded />}</Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ color: "secondary.main", fontWeight: 700, overflowWrap: "anywhere" }}>{manualRecipient.name || "Nuevo beneficiario"}</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ overflowWrap: "anywhere" }}>{recipientBank?.name ?? "Banco por seleccionar"}</Typography>
                  <Typography color="text.secondary" variant="caption" sx={{ overflowWrap: "anywhere" }}>{manualRecipient.documentNumber ? formatDocument(manualRecipient.documentType, manualRecipient.documentNumber) : "Documento pendiente"}{manualRecipient.phone ? ` · ${formatPhone(manualRecipient.phone)}` : ""}</Typography>
                </Box>
                {recipientMode === "directory" && <AccountBalanceRounded color="primary" fontSize="small" />}
              </Box>
            )}
          </Stack>

          <Card elevation={0} sx={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 0, bgcolor: "transparent" }}>
            <CardContent sx={{ flex: 1, p: 2, "&:last-child": { pb: 2 } }}>
              <Stack spacing={1.5}>
                <TextField disabled={isSubmitting} error={Boolean(errors.amount)} fullWidth helperText={errors.amount} inputRef={amountRef} label="Monto a enviar" name="amount" onBlur={completeAmountFormat} onChange={(event) => updateAmount(event.target.value, event.target)} placeholder="0,00" required size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs.</InputAdornment> }, inputLabel: { shrink: true }, htmlInput: { inputMode: "decimal" } }} sx={paymentFieldSx} value={amount} />
                <TextField disabled={isSubmitting} fullWidth label="Concepto" name="concept" onChange={(event) => onConceptChange(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: maxPaymentConceptLength } }} sx={paymentFieldSx} value={concept} />
                <PaymentIconSelector disabled={isSubmitting} onSelect={onSelectIcon} selectedIcon={selectedIcon} />
                {recipientMode === "manual" && <FormControlLabel control={<Checkbox checked={manualRecipient.saveToDirectory} disabled={isSubmitting} onChange={(event) => onManualChange("saveToDirectory", event.target.checked)} />} label="Guardar este beneficiario en mi directorio" sx={{ m: 0, px: 1, py: 0.5, borderRadius: 2, bgcolor: "#F4F5F8", alignItems: "center" }} />}
                {submitError && <Alert aria-live="assertive" role="alert" severity="error">{submitError}</Alert>}
                <Button disabled={isSubmitting || accessStatus !== "active"} fullWidth sx={{ borderRadius: 8, minHeight: 48 }} type="submit" variant="contained">{isSubmitting ? "Preparando pago…" : "Continuar"}</Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}
