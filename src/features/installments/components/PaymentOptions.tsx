import Link from "next/link";
import {
  AddRounded,
  RemoveRounded,
} from "@mui/icons-material";
import {
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
import { paymentSelectionToQuery } from "../paymentOptions";
import type { PaymentOptionKind } from "../types";
import { installmentsPrimary } from "./ConsumptionSummary";
import { visuallyHidden } from "./InstallmentSchedule";
import { pillButton } from "./StateCard";

const { color } = homeVisualTokens;

type PaymentOptionsProps = Readonly<{
  consumptionId: string;
  choices: PaymentChoices;
  selection: PaymentSelection;
  onSelectionChange: (selection: PaymentSelection) => void;
  /** Hay un pago de este consumo en validación: no se puede reportar otro. */
  hasPaymentInReview: boolean;
}>;

function CountStepper({
  count,
  min,
  max,
  onChange,
}: Readonly<{ count: number; min: number; max: number; onChange: (count: number) => void }>) {
  const buttonSx = {
    // Se ve de 28 px, pero el área táctil (::after) llega a 44 px.
    position: "relative",
    width: 28,
    height: 28,
    minWidth: 0,
    minHeight: 0,
    "&::after": { content: '""', position: "absolute", inset: -8 },
    bgcolor: color.white,
    color: installmentsPrimary,
    border: `1px solid ${alpha(installmentsPrimary, 0.4)}`,
    "&:hover": { bgcolor: color.surfaceTint },
    "& .MuiSvgIcon-root": { fontSize: 18 },
  } as const;

  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ flexShrink: 0, alignItems: "center" }}
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
        sx={{ minWidth: 20, color: color.navy, fontSize: "0.9375rem", fontWeight: 600, textAlign: "center" }}
      >
        <Box component="span" sx={visuallyHidden}>Cuotas a pagar: </Box>
        {count}
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
  choices,
  selection,
  onSelectionChange,
  hasPaymentInReview,
}: PaymentOptionsProps) {
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
        sx={{ mb: 1.25, color: color.navy, fontSize: "1.0625rem", fontWeight: 600, textAlign: "center" }}
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
          // Siempre visible al elegirla, aunque haya un único valor (p. ej. 3 cuotas → solo 2):
          // así se entiende qué hace la opción (Gabriel, 25/09). Los botones quedan deshabilitados.
          const showStepper = choice.kind === "CUOTAS" && isSelected && countRange;

          return (
            <Stack
              direction="row"
              key={choice.kind}
              sx={{
                alignItems: "center",
                pr: showStepper ? 1.5 : 0,
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
                  <Typography sx={{ py: 0.75, color: color.navy, fontSize: "0.9375rem", fontWeight: 500 }}>
                    {choice.label}
                  </Typography>
                )}
                sx={{
                  m: 0,
                  flex: 1,
                  minWidth: 0,
                  py: 0.5,
                  pr: 2,
                  "& .MuiFormControlLabel-label": { flex: 1, minWidth: 0 },
                }}
                value={choice.kind}
              />
              {/* Al lado del texto (Gabriel, 25/09). */}
              {showStepper && (
                <CountStepper
                  count={selection.installmentCount ?? countRange.min}
                  max={countRange.max}
                  min={countRange.min}
                  onChange={(count) => onSelectionChange({ option: "CUOTAS", installmentCount: count })}
                />
              )}
            </Stack>
          );
        })}
      </RadioGroup>

      <Typography sx={{ mt: 1.25, color: color.neutral, fontSize: "0.75rem", textAlign: "center" }}>
        Consulta el monto final antes de pagar.
      </Typography>

      {hasPaymentInReview && (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 3 }}>
          Ya tienes un pago en validación para este consumo.
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        {hasPaymentInReview ? (
          <Button disabled fullWidth sx={pillButton} variant="contained">
            Ver instrucciones de pago
          </Button>
        ) : (
          <Button
            component={Link}
            fullWidth
            href={`/installments/${consumptionId}/payment?${paymentSelectionToQuery(selection)}`}
            sx={pillButton}
            variant="contained"
          >
            Ver instrucciones de pago
          </Button>
        )}
      </Box>
    </Box>
  );
}
