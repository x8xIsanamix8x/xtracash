"use client";

import type { FormEvent, Ref } from "react";
import { useEffect, useRef } from "react";
import {
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { PaymentReportFormErrors, SourceBank } from "../types";
import { PaymentReportStepLayout } from "./PaymentReportStepLayout";

type PaymentReportFormStepProps = Readonly<{
  errors: PaymentReportFormErrors;
  focusRequest: number;
  isValid: boolean;
  originBank: string;
  paymentDate: string;
  reference: string;
  senderPhone: string;
  sourceBanks: readonly SourceBank[];
  submissionError: string;
  titleRef: Ref<HTMLHeadingElement>;
  today: string;
  onOriginBankChange: (value: string) => void;
  onPaymentDateChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onSenderPhoneChange: (value: string) => void;
  onSubmit: () => void;
}>;

export function PaymentReportFormStep({
  errors,
  focusRequest,
  isValid,
  originBank,
  paymentDate,
  reference,
  senderPhone,
  sourceBanks,
  submissionError,
  titleRef,
  today,
  onOriginBankChange,
  onPaymentDateChange,
  onReferenceChange,
  onSenderPhoneChange,
  onSubmit,
}: PaymentReportFormStepProps) {
  const bankRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors.originBank) {
      bankRef.current?.focus();
    } else if (errors.senderPhone) {
      phoneRef.current?.focus();
    } else if (errors.paymentDate) {
      dateRef.current?.focus();
    } else if (errors.reference) {
      referenceRef.current?.focus();
    }
  }, [errors, focusRequest]);

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={submitForm}
      noValidate
      style={{ width: "100%", height: "100%", minHeight: 0 }}
    >
      <PaymentReportStepLayout
        actions={(
          <Button disabled={!isValid} fullWidth type="submit" variant="contained">
            Reportar pago
          </Button>
        )}
        description="Ingresa los datos del pago que realizaste."
        title="Reporta tu pago"
        titleId="payment-report-form-title"
        titleRef={titleRef}
      >
        <Stack spacing={2.5}>
          <TextField
            error={Boolean(errors.originBank)}
            fullWidth
            helperText={errors.originBank}
            inputRef={bankRef}
            label="Banco de origen"
            name="originBank"
            onChange={(event) => onOriginBankChange(event.target.value)}
            required
            select
            slotProps={{
              inputLabel: { shrink: true },
              select: { displayEmpty: true },
            }}
            value={originBank}
          >
            <MenuItem disabled value="">
              Selecciona un banco
            </MenuItem>
            {sourceBanks.map((bank) => (
              <MenuItem key={bank.code} value={bank.code}>
                {bank.code} · {bank.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            autoComplete="tel"
            error={Boolean(errors.senderPhone)}
            fullWidth
            helperText={errors.senderPhone ?? "Ingresa los once dígitos del número emisor."}
            inputRef={phoneRef}
            label="Número del teléfono emisor"
            name="senderPhone"
            onChange={(event) => onSenderPhoneChange(event.target.value)}
            required
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                maxLength: 11,
                pattern: "[0-9]*",
              },
            }}
            type="tel"
            value={senderPhone}
          />

          <TextField
            error={Boolean(errors.paymentDate)}
            fullWidth
            helperText={errors.paymentDate}
            inputRef={dateRef}
            label="Fecha del pago"
            name="paymentDate"
            onChange={(event) => onPaymentDateChange(event.target.value)}
            required
            slotProps={{
              htmlInput: { max: today },
              inputLabel: { shrink: true },
            }}
            type="date"
            value={paymentDate}
          />

          <TextField
            error={Boolean(errors.reference)}
            fullWidth
            helperText={errors.reference
              ?? "Usa únicamente los cuatro últimos dígitos."}
            inputRef={referenceRef}
            label="Últimos cuatro dígitos de la referencia"
            name="reference"
            onChange={(event) => onReferenceChange(event.target.value)}
            required
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                maxLength: 4,
                pattern: "[0-9]*",
              },
            }}
            type="text"
            value={reference}
          />

          {submissionError && (
            <Typography color="error" role="alert" variant="body2">
              {submissionError}
            </Typography>
          )}
        </Stack>
      </PaymentReportStepLayout>
    </form>
  );
}
