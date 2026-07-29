"use client";

import { Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, Typography } from "@mui/material";

type PaymentProximity = "upcoming" | "overdue";

type PaymentProximityDefinition = Readonly<{
  color: "warning" | "error";
  label: string;
}>;

const paymentProximityConfig: Record<
  PaymentProximity,
  PaymentProximityDefinition
> = {
  upcoming: {
    color: "warning",
    label: "Pago próximo",
  },
  overdue: {
    color: "error",
    label: "Pago vencido",
  },
};

type CreditSummaryProps = Readonly<{
  creditLimit: string;
  currentDebt: string;
  minimumPayment: string;
  dueDateLabel: string;
  paymentProximity: PaymentProximity;
  usedPercentage: number;
  annualRate: string;
  onPay: () => void;
}>;

export function CreditSummary({
  creditLimit,
  currentDebt,
  minimumPayment,
  dueDateLabel,
  paymentProximity,
  usedPercentage,
  annualRate,
  onPay,
}: CreditSummaryProps) {
  const dueStatus = paymentProximityConfig[paymentProximity];

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

          <Box>
            <Typography color="text.secondary" variant="body2">Límite de crédito</Typography>
            <Typography sx={{ fontWeight: 700 }}>{creditLimit}</Typography>
          </Box>

          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary" variant="body2">Crédito utilizado</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{usedPercentage}%</Typography>
            </Stack>
            <LinearProgress
              aria-label="Crédito utilizado"
              aria-valuenow={usedPercentage}
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
                <Chip
                  aria-label={`${dueStatus.label}. Vence el ${dueDateLabel}.`}
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
              </Box>
            </Stack>
            <Typography color="text.secondary" variant="body2">Pago mínimo</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{minimumPayment}</Typography>
            <Typography color="text.secondary">Vence el {dueDateLabel}</Typography>
            <Button fullWidth onClick={onPay} variant="contained">Pagar</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
