import Link from "next/link";
import {
  AddRounded,
  ExpandMoreRounded,
  RemoveRounded,
  ScheduleRounded,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import type { PaymentChoices, PaymentSelection } from "../paymentOptions";
import {
  createAmountBreakdown,
  formatRateNote,
  getSelectedOption,
  paymentSelectionToQuery,
} from "../paymentOptions";
import type { PaymentOptionKind, PaymentQuote } from "../types";
import { installmentsPrimary } from "./ConsumptionSummary";
import { pillButton } from "./StateCard";

const { color } = homeVisualTokens;

type PaymentOptionsProps = Readonly<{
  consumptionId: string;
  quote: PaymentQuote;
  choices: PaymentChoices;
  selection: PaymentSelection;
  onSelectionChange: (selection: PaymentSelection) => void;
  interestFreeDays: number | null;
  /** Hay un pago de este consumo en validación: no se puede reportar otro. */
  hasPaymentInReview: boolean;
  onShowInstructions?: () => void;
}>;

function CountStepper({
  count,
  min,
  max,
  onChange,
}: Readonly<{ count: number; min: number; max: number; onChange: (count: number) => void }>) {
  const buttonSx = {
    width: 36,
    height: 36,
    bgcolor: color.white,
    color: installmentsPrimary,
    border: `1px solid ${alpha(installmentsPrimary, 0.4)}`,
    "&:hover": { bgcolor: color.surfaceTint },
  } as const;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", justifyContent: "center" }}
    >
      <IconButton
        aria-label="Una cuota menos"
        disabled={count <= min}
        onClick={() => onChange(count - 1)}
        sx={buttonSx}
      >
        <RemoveRounded />
      </IconButton>
      <Typography
        aria-live="polite"
        sx={{ minWidth: 88, color: color.navy, fontWeight: 800, textAlign: "center" }}
      >
        {count} cuotas
      </Typography>
      <IconButton
        aria-label="Una cuota más"
        disabled={count >= max}
        onClick={() => onChange(count + 1)}
        sx={buttonSx}
      >
        <AddRounded />
      </IconButton>
    </Stack>
  );
}

export function PaymentOptions({
  consumptionId,
  quote,
  choices,
  selection,
  onSelectionChange,
  interestFreeDays,
  hasPaymentInReview,
  onShowInstructions,
}: PaymentOptionsProps) {
  const selected = getSelectedOption(quote, selection);
  const breakdown = selected ? createAmountBreakdown(selected) : null;
  const countRange = choices.countRange;

  const select = (kind: PaymentOptionKind) => {
    onSelectionChange(kind === "CUOTAS"
      ? { option: "CUOTAS", installmentCount: selection.installmentCount ?? countRange?.min }
      : { option: kind });
  };

  return (
    <Box component="section" aria-labelledby="payment-options-title" id="payment-options">
      <Typography
        component="h2"
        id="payment-options-title"
        sx={{ mb: 1.25, color: color.navy, fontSize: "1.0625rem", fontWeight: 800, textAlign: "center" }}
      >
        {choices.onlyAllPending ? "Paga el total pendiente" : "¿Quieres adelantar?"}
      </Typography>

      {choices.onlyAllPending && (
        <Alert severity="warning" sx={{ mb: 1.25, borderRadius: 3 }}>
          Tu plazo venció: para reactivar debes pagar el total pendiente.
        </Alert>
      )}

      <RadioGroup
        aria-labelledby="payment-options-title"
        onChange={(event) => select(event.target.value as PaymentOptionKind)}
        sx={{ gap: 1 }}
        value={selection.option}
      >
        {choices.choices.map((choice) => {
          const isSelected = choice.kind === selection.option;
          // Con un único valor posible (p. ej. 3 cuotas → solo 2) el contador no aporta.
          const showStepper = choice.kind === "CUOTAS" && isSelected && countRange
            && countRange.max > countRange.min;
          const description = isSelected && breakdown ? breakdown.description : choice.description;
          const amount = isSelected && breakdown ? breakdown.total : choice.amount;

          return (
            <Box
              key={choice.kind}
              sx={{
                borderRadius: "24px",
                border: "1.5px solid",
                borderColor: isSelected ? installmentsPrimary : "transparent",
                bgcolor: isSelected ? alpha(installmentsPrimary, 0.06) : color.neutralSurface,
                transition: "border-color 120ms, background-color 120ms",
              }}
            >
              <FormControlLabel
                control={(
                  <Radio
                    sx={{ color: color.navy, "&.Mui-checked": { color: installmentsPrimary } }}
                  />
                )}
                label={(
                  <Box sx={{ py: 0.5 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "baseline", justifyContent: "space-between" }}
                    >
                      <Typography sx={{ minWidth: 0, color: color.navy, fontSize: "0.875rem", fontWeight: 700 }}>
                        {choice.label}
                      </Typography>
                      <Typography
                        sx={{ flexShrink: 0, color: color.navy, fontSize: "0.875rem", fontWeight: 800 }}
                      >
                        {amount}
                      </Typography>
                    </Stack>
                    <Typography sx={{ color: color.neutral, fontSize: "0.75rem" }}>
                      {description}
                    </Typography>
                  </Box>
                )}
                sx={{
                  m: 0,
                  width: "100%",
                  py: 0.5,
                  pr: 2,
                  "& .MuiFormControlLabel-label": { flex: 1, minWidth: 0 },
                }}
                value={choice.kind}
              />
              {showStepper && (
                <Box sx={{ pb: 1.5 }}>
                  <CountStepper
                    count={selection.installmentCount ?? countRange.min}
                    max={countRange.max}
                    min={countRange.min}
                    onChange={(count) => onSelectionChange({ option: "CUOTAS", installmentCount: count })}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </RadioGroup>

      {breakdown && (
        <Accordion
          defaultExpanded
          disableGutters
          elevation={0}
          sx={{
            mt: 1.5,
            borderRadius: "16px !important",
            bgcolor: color.surfaceTint,
            "&::before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography sx={{ color: color.navy, fontWeight: 700 }}>Ver detalle del monto</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Stack component="dl" spacing={0.75} sx={{ m: 0 }}>
              {breakdown.lines.map((line) => (
                <Stack direction="row" key={line.label} sx={{ justifyContent: "space-between" }}>
                  <Typography component="dt" sx={{ color: color.neutral, fontSize: "0.875rem" }}>
                    {line.label}
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, color: color.navy, fontSize: "0.875rem", fontWeight: 700 }}>
                    {line.amount}
                  </Typography>
                </Stack>
              ))}
              <Stack
                direction="row"
                sx={{ pt: 0.75, justifyContent: "space-between", borderTop: `1px solid ${color.lavender}` }}
              >
                <Typography component="dt" sx={{ color: color.navy, fontWeight: 800 }}>
                  Total a pagar
                </Typography>
                <Typography component="dd" sx={{ m: 0, color: installmentsPrimary, fontWeight: 800 }}>
                  {breakdown.total}
                </Typography>
              </Stack>
            </Stack>
            {breakdown.interestFree && (
              <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, alignItems: "center" }}>
                <ScheduleRounded aria-hidden="true" sx={{ color: installmentsPrimary, fontSize: 18 }} />
                <Typography sx={{ color: color.navy, fontSize: "0.8125rem" }}>
                  Sin intereses: estás dentro de los primeros {interestFreeDays ?? 15} días.
                </Typography>
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      <Typography sx={{ mt: 1.25, color: color.neutral, fontSize: "0.75rem", textAlign: "center" }}>
        Consulta el monto final antes de pagar. {formatRateNote(quote)}.
      </Typography>

      {hasPaymentInReview && (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 3 }}>
          Ya tienes un pago en validación para este consumo.
        </Alert>
      )}

      <Stack spacing={1} sx={{ mt: 2 }}>
        {hasPaymentInReview ? (
          <Button disabled fullWidth sx={pillButton} variant="contained">
            Ya pagué · Reportar pago
          </Button>
        ) : (
          <Button
            component={Link}
            fullWidth
            href={`/installments/${consumptionId}/report?${paymentSelectionToQuery(selection)}`}
            sx={pillButton}
            variant="contained"
          >
            Ya pagué · Reportar pago
          </Button>
        )}
        {onShowInstructions && (
          <Button
            fullWidth
            onClick={onShowInstructions}
            sx={{ minHeight: 48, borderRadius: 99, color: color.navy, fontWeight: 700 }}
          >
            Ver instrucciones de pago
          </Button>
        )}
      </Stack>
    </Box>
  );
}
