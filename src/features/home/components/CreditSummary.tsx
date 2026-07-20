"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, Typography } from "@mui/material";

type DueStatus = Readonly<{
  color: "success" | "warning" | "error";
  label: string;
  relativeLabel: string;
}>;

const MILLISECONDS_PER_DAY = 86_400_000;
const subscribeToClient = () => () => undefined;

function getDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLISECONDS_PER_DAY;
}

function calculateDueStatus(dueDate: string, today = new Date()): DueStatus {
  const [year, month, day] = dueDate.split("-").map(Number);
  const dueDayNumber = Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
  const daysRemaining = dueDayNumber - getDayNumber(today);

  const relativeLabel = daysRemaining > 0
    ? `Faltan ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"}`
    : daysRemaining === 0
      ? "Vence hoy"
      : `Venció hace ${Math.abs(daysRemaining)} ${daysRemaining === -1 ? "día" : "días"}`;

  if (daysRemaining > 7) {
    return { color: "success", label: "A tiempo", relativeLabel };
  }

  if (daysRemaining >= 3) {
    return { color: "warning", label: "Vence pronto", relativeLabel };
  }

  if (daysRemaining >= 0) {
    return { color: "error", label: "Pago cercano", relativeLabel };
  }

  return { color: "error", label: "Pago vencido", relativeLabel };
}

type CreditSummaryProps = Readonly<{
  currentDebt: string;
  minimumPayment: string;
  dueDate: string;
  dueDateLabel: string;
  usedPercentage: number;
  annualRate: string;
  onPay: () => void;
}>;

export function CreditSummary({
  currentDebt,
  minimumPayment,
  dueDate,
  dueDateLabel,
  usedPercentage,
  annualRate,
  onPay,
}: CreditSummaryProps) {
  const calculatedDueStatus = useMemo(() => calculateDueStatus(dueDate), [dueDate]);
  const dueStatus = useSyncExternalStore(
    subscribeToClient,
    () => calculatedDueStatus,
    () => null,
  );

  return (
    <Card component="section" variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Resumen del crédito
          </Typography>

          <Stack direction="row" spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Typography color="text.secondary" variant="body2">Deuda actual</Typography>
              <Typography sx={{ fontWeight: 700 }}>{currentDebt}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography color="text.secondary" variant="body2">Tasa anual</Typography>
              <Typography sx={{ fontWeight: 700 }}>{annualRate}</Typography>
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary" variant="body2">Crédito utilizado</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{usedPercentage}%</Typography>
            </Stack>
            <LinearProgress
              aria-label="Crédito utilizado"
              aria-valuetext={`${usedPercentage} por ciento`}
              value={usedPercentage}
              variant="determinate"
            />
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Stack
              direction="row"
              sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}
            >
              <Typography component="h3" variant="subtitle1" sx={{ color: "secondary.main", fontWeight: 700 }}>
                Próximo pago
              </Typography>
              <Box sx={{ display: "flex", minHeight: 24, minWidth: 112 }}>
                {dueStatus && (
                  <Chip
                    aria-label={`${dueStatus.label}. ${dueStatus.relativeLabel}.`}
                    label={
                      <Stack component="span" direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <Box
                          component="span"
                          sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: `${dueStatus.color}.main` }}
                        />
                        <Box component="span">{dueStatus.label}</Box>
                      </Stack>
                    }
                    size="small"
                    sx={{
                      borderColor: `${dueStatus.color}.main`,
                      bgcolor: "background.paper",
                      color: "text.primary",
                      fontWeight: 700,
                    }}
                    variant="outlined"
                  />
                )}
              </Box>
            </Stack>
            <Typography color="text.secondary" variant="body2">Pago mínimo</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{minimumPayment}</Typography>
            <Stack spacing={0.25}>
              <Typography color="text.secondary">Vence el {dueDateLabel}</Typography>
              <Typography
                aria-live="polite"
                color="text.secondary"
                role="status"
                variant="body2"
                sx={{ minHeight: "1.5em" }}
              >
                {dueStatus?.relativeLabel ?? "\u00a0"}
              </Typography>
            </Stack>
            <Button fullWidth onClick={onPay} variant="contained">Pagar</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
