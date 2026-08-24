import { AccountBalanceWalletRounded } from "@mui/icons-material";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatBolivars } from "@/features/home/presentation";

import type { CreditMovementsPage } from "../types";

type MovementsSummaryCardProps = Readonly<{
  data: CreditMovementsPage;
}>;

type MetricProps = Readonly<{
  label: string;
  value: string;
}>;

function Metric({ label, value }: MetricProps) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography
        sx={{
          color: "secondary.main",
          fontSize: { xs: "1rem", sm: "1.125rem" },
          fontVariantNumeric: "tabular-nums",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export function MovementsSummaryCard({ data }: MovementsSummaryCardProps) {
  return (
    <Card
      component="section"
      aria-labelledby="movements-balance-title"
      variant="outlined"
      sx={(theme) => ({
        borderColor: alpha(theme.palette.primary.main, 0.24),
        borderRadius: { xs: "16px", md: 3 },
        background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.12)}, ${theme.palette.background.paper} 68%)`,
      })}
    >
      <CardContent
        sx={{
          p: { xs: 2.5, sm: 3 },
          "&:last-child": { pb: { xs: 2.5, sm: 3 } },
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 48,
                height: 48,
                display: "grid",
                flexShrink: 0,
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
              })}
            >
              <AccountBalanceWalletRounded />
            </Box>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                id="movements-balance-title"
                variant="body2"
              >
                Disponible total
              </Typography>
              <Typography
                component="p"
                sx={{
                  color: "secondary.main",
                  fontSize: { xs: "1.75rem", sm: "2rem" },
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  overflowWrap: "anywhere",
                }}
              >
                {formatBolivars(data.availableBs)}
              </Typography>
            </Stack>
          </Stack>

          <Box
            sx={(theme) => ({
              display: "grid",
              gap: { xs: 2, sm: 3 },
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              pt: 2,
              borderTop: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.16),
            })}
          >
            <Metric
              label="Deuda actual"
              value={formatBolivars(data.currentDebtBs)}
            />
            <Metric
              label="Pago mínimo"
              value={formatBolivars(data.minimumPaymentBs)}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
