"use client";

import type { FormEvent, RefObject } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { pillFieldSx } from "@/features/auth/shared/pillFieldSx";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";
import { formatBolivars } from "@/features/home/presentation";

import type { ConsumptionDetailViewModel } from "../presentation";
import type { ReportFormErrors, ReportFormField, ReportFormValues } from "../reportForm";
import { firstErrorField } from "../reportForm";
import type { SourceBank } from "../types";
import { ConsumptionSummary, installmentsPrimary } from "./ConsumptionSummary";
import { PaymentSupportField } from "./PaymentSupportField";
import { pillButton } from "./StateCard";

const { color } = homeVisualTokens;
const fieldSx = pillFieldSx(color.neutralSurface);

/** Monto esperado a la fecha elegida: se vuelve a calcular al cambiar la fecha. */
export type ExpectedAmount =
  /** Fecha inválida: el error ya se muestra en el campo. */
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "ready"; amountBs: string }>
  | Readonly<{ status: "rate_unavailable" }>
  | Readonly<{ status: "error"; retry: () => void }>;

type ReportFormProps = Readonly<{
  header: ConsumptionDetailViewModel["header"];
  /** "Cuota 01 a 02 · hasta el 22 oct." */
  payingLabel: string;
  values: ReportFormValues;
  /** Lo que muestra el campo monto (prellenado mientras el usuario no lo edite). */
  amountInput: string;
  errors: ReportFormErrors;
  focusRequest: number;
  expected: ExpectedAmount;
  sourceBanks: readonly SourceBank[];
  today: string;
  minDate: string;
  receiptFile: File | null;
  receiptError?: string;
  submitting: boolean;
  detailHref: string;
  onChange: (field: ReportFormField, value: string | boolean) => void;
  onReceiptSelect: (file: File) => void;
  onReceiptRemove: () => void;
  onSubmit: () => void;
}>;

export function ReportForm({
  header,
  payingLabel,
  values,
  amountInput,
  errors,
  focusRequest,
  expected,
  sourceBanks,
  today,
  minDate,
  receiptFile,
  receiptError,
  submitting,
  detailHref,
  onChange,
  onReceiptSelect,
  onReceiptRemove,
  onSubmit,
}: ReportFormProps) {
  const bankRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const confirmedRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusRequest === 0) return;
    const fieldRefs: Record<ReportFormField, RefObject<HTMLInputElement | null>> = {
      senderBank: bankRef,
      bankReference: referenceRef,
      paymentDate: dateRef,
      senderPhone: phoneRef,
      amount: amountRef,
      confirmed: confirmedRef,
    };
    const field = firstErrorField(errors);
    if (field) fieldRefs[field].current?.focus();
    // Solo al pedir foco (cada intento de envío), no con cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  const dateError = errors.paymentDate
    ?? (expected.status === "rate_unavailable"
      ? "No hay tasa registrada para esa fecha. Elige otra fecha."
      : undefined);
  const canSubmit = expected.status === "ready" && !submitting;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <Box component="form" noValidate onSubmit={submit}>
      <Stack spacing={1.5}>
        <ConsumptionSummary header={header} />
        <Typography sx={{ color: color.navy, fontSize: "0.875rem" }}>
          <Box component="span" sx={{ fontWeight: 700 }}>Pagando:</Box> {payingLabel}
        </Typography>

        <TextField
          error={Boolean(errors.senderBank)}
          fullWidth
          helperText={errors.senderBank}
          inputRef={bankRef}
          label="Banco desde el que pagaste"
          onChange={(event) => onChange("senderBank", event.target.value)}
          required
          select
          sx={fieldSx}
          value={values.senderBank}
          variant="filled"
        >
          {sourceBanks.map((bank) => (
            <MenuItem key={bank.code} value={bank.code}>
              {bank.name} ({bank.code})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          error={Boolean(errors.bankReference)}
          fullWidth
          helperText={errors.bankReference ?? "El número completo que te dio el banco."}
          inputRef={referenceRef}
          label="Referencia de pago"
          onChange={(event) => onChange("bankReference", event.target.value)}
          required
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 20 } }}
          sx={fieldSx}
          value={values.bankReference}
          variant="filled"
        />

        <TextField
          error={Boolean(dateError)}
          fullWidth
          helperText={dateError}
          inputRef={dateRef}
          label="Fecha del pago"
          onChange={(event) => onChange("paymentDate", event.target.value)}
          required
          slotProps={{ htmlInput: { min: minDate, max: today }, inputLabel: { shrink: true } }}
          sx={fieldSx}
          type="date"
          value={values.paymentDate}
          variant="filled"
        />

        <TextField
          autoComplete="tel"
          error={Boolean(errors.senderPhone)}
          fullWidth
          helperText={errors.senderPhone}
          inputRef={phoneRef}
          label="Número de teléfono"
          onChange={(event) => onChange("senderPhone", event.target.value)}
          required
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 11 } }}
          sx={fieldSx}
          type="tel"
          value={values.senderPhone}
          variant="filled"
        />

        <TextField
          error={Boolean(errors.amount)}
          fullWidth
          helperText={errors.amount ?? (expected.status === "ready"
            ? `Monto de la opción a esa fecha: ${formatBolivars(expected.amountBs)}`
            : undefined)}
          inputRef={amountRef}
          label="Monto (Bs.)"
          onChange={(event) => onChange("amount", event.target.value)}
          required
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
          sx={fieldSx}
          value={amountInput}
          variant="filled"
        />

        {expected.status === "loading" && (
          <Stack direction="row" role="status" spacing={1} sx={{ alignItems: "center" }}>
            <CircularProgress size={16} />
            <Typography sx={{ color: color.neutral, fontSize: "0.8125rem" }}>Calculando monto…</Typography>
          </Stack>
        )}
        {expected.status === "error" && (
          <Alert
            action={<Button color="inherit" onClick={expected.retry} size="small">Reintentar</Button>}
            severity="error"
            sx={{ borderRadius: 3 }}
          >
            No pudimos calcular el monto para esa fecha.
          </Alert>
        )}

        <PaymentSupportField
          error={receiptError}
          file={receiptFile}
          focusError={Boolean(receiptError)}
          focusRequest={focusRequest}
          onRemove={onReceiptRemove}
          onSelect={onReceiptSelect}
        />

        <Box>
          <FormControlLabel
            control={(
              <Checkbox
                checked={values.confirmed}
                onChange={(event) => onChange("confirmed", event.target.checked)}
                slotProps={{ input: { ref: confirmedRef } }}
                sx={{ "&.Mui-checked": { color: installmentsPrimary } }}
              />
            )}
            label="El monto corresponde a la opción seleccionada"
            slotProps={{ typography: { sx: { color: color.navy, fontSize: "0.8125rem" } } }}
          />
          {errors.confirmed && <FormHelperText error sx={{ mx: 2 }}>{errors.confirmed}</FormHelperText>}
        </Box>

        <Button
          disabled={!canSubmit}
          fullWidth
          startIcon={submitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          sx={pillButton}
          type="submit"
          variant="contained"
        >
          {submitting ? "Enviando…" : "Reportar pago"}
        </Button>
        <Button
          component={Link}
          fullWidth
          href={detailHref}
          sx={{ minHeight: 44, borderRadius: 99, color: color.navy, fontWeight: 700 }}
        >
          Volver a cuotas
        </Button>
      </Stack>
    </Box>
  );
}
