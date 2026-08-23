"use client";

import type { FormEvent, Ref } from "react";
import { useEffect, useRef } from "react";
import { Button, MenuItem, Stack, TextField } from "@mui/material";

import { temporarySourceBanks } from "../data/paymentReport";
import type { PaymentReportFormErrors } from "../types";
import { PaymentReportStepLayout } from "./PaymentReportStepLayout";

type PaymentReportFormStepProps = Readonly<{
  errors: PaymentReportFormErrors;
  focusRequest: number;
  isValid: boolean;
  originBank: string;
  reference: string;
  titleRef: Ref<HTMLHeadingElement>;
  onOriginBankChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onSubmit: () => void;
}>;

export function PaymentReportFormStep({
  errors,
  focusRequest,
  isValid,
  originBank,
  reference,
  titleRef,
  onOriginBankChange,
  onReferenceChange,
  onSubmit,
}: PaymentReportFormStepProps) {
  const bankRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors.originBank) {
      bankRef.current?.focus();
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
        description="Indica desde qué banco pagaste y los últimos cuatro dígitos de la referencia."
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
            {temporarySourceBanks.map((bank) => (
              <MenuItem key={bank.code} value={bank.code}>
                {bank.code} · {bank.name}
              </MenuItem>
            ))}
          </TextField>

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
        </Stack>
      </PaymentReportStepLayout>
    </form>
  );
}
