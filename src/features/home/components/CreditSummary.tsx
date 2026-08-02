"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowForwardRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  CreditLineStatusChip,
  isCreditLineUsable,
} from "@/features/credit-line";

import type { FinancingSummary } from "../types";

type CreditSummaryProps = Readonly<{
  financing: FinancingSummary;
  onReportPayment: () => void;
}>;

type MetricProps = Readonly<{
  label: string;
  value: string;
}>;

function Metric({ label, value }: MetricProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography
        sx={{
          color: "text.primary",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
        variant="body1"
      >
        {value}
      </Typography>
    </Box>
  );
}

export function CreditSummary({
  financing,
  onReportPayment,
}: CreditSummaryProps) {
  const [isAvailableVisible, setIsAvailableVisible] = useState(false);
  const canRequestMobilePayment = isCreditLineUsable(financing.status);
  const hasFrozenAmount = financing.frozenAmount !== null;
  const availableLabel = canRequestMobilePayment
    ? "Disponible utilizable"
    : "Disponible total";

  return (
    <Card
      component="section"
      aria-label="Resumen del financiamiento"
      sx={(theme) => ({
        position: "relative",
        height: "100%",
        overflow: "hidden",
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.16),
        background: `linear-gradient(145deg, ${theme.palette.background.paper} 30%, ${alpha(
          theme.palette.primary.main,
          0.11,
        )} 100%)`,
        boxShadow: `0 10px 28px ${alpha(theme.palette.secondary.main, 0.1)}`,
      })}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "absolute",
          width: 250,
          height: 145,
          top: -78,
          right: -72,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.13),
          pointerEvents: "none",
        })}
      />
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "absolute",
          width: 190,
          height: 112,
          top: -58,
          right: -112,
          borderRadius: "50%",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.2),
          pointerEvents: "none",
        })}
      />

      <CardContent
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          p: { xs: 2.5, sm: 3 },
          "&:last-child": { pb: { xs: 2.5, sm: 3 } },
        }}
      >
        <Stack spacing={2.5} sx={{ height: "100%" }}>
          <Stack
            direction="row"
            sx={{
              minWidth: 0,
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 1.5,
              justifyContent: "space-between",
            }}
          >
            <Typography
              component="h2"
              variant="h6"
              sx={{ color: "secondary.main", fontWeight: 700 }}
            >
              Tu financiamiento
            </Typography>
            <CreditLineStatusChip status={financing.status} />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography color="text.secondary" variant="body2">
                {availableLabel}
              </Typography>
              <Typography
                noWrap
                variant="h4"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                {isAvailableVisible
                  ? canRequestMobilePayment
                    ? financing.usableAvailable
                    : financing.totalAvailable
                  : "Bs. ••••••"}
              </Typography>
            </Box>
            <IconButton
              aria-label={
                isAvailableVisible ? "Ocultar disponible" : "Mostrar disponible"
              }
              aria-pressed={isAvailableVisible}
              onClick={() => setIsAvailableVisible((current) => !current)}
              type="button"
            >
              {isAvailableVisible
                ? <VisibilityOffRounded />
                : <VisibilityRounded />}
            </IconButton>
          </Stack>

          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "minmax(0, 1.25fr) minmax(0, 0.75fr)",
              },
              gap: 2,
              alignItems: "center",
              p: { xs: 1.75, sm: 2 },
              borderRadius: 2,
              borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.55)}`,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08,
              )} 0%, ${theme.palette.background.paper} 72%, ${alpha(
                theme.palette.primary.main,
                0.05,
              )} 100%)`,
            })}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" variant="body2">
                Próximo corte
              </Typography>
              <Typography
                sx={{
                  color: "secondary.main",
                  fontWeight: 800,
                  overflowWrap: "anywhere",
                }}
                variant="h5"
              >
                {financing.nextCutDate}
              </Typography>
            </Box>
            <Metric label="Deuda actual" value={financing.currentDebt} />
          </Box>

          {hasFrozenAmount && (
            <Box
              sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.08),
              })}
            >
              <Metric label="Disponible total" value={financing.totalAvailable} />
              <Metric label="Monto congelado" value={financing.frozenAmount} />
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            <Metric label="Límite asignado" value={financing.assignedLimit} />
            <Metric label="Pago mínimo" value={financing.minimumPayment} />
          </Box>

          <Stack spacing={1.25} sx={{ mt: "auto" }}>
            {canRequestMobilePayment && (
              <Button
                component={Link}
                endIcon={<ArrowForwardRounded />}
                fullWidth
                href="/mobile-payment"
                variant="contained"
              >
                Solicitar Pago Móvil
              </Button>
            )}
            {financing.status === "ACTIVA" && (
              <Button
                fullWidth
                onClick={onReportPayment}
                type="button"
                variant="outlined"
              >
                Reportar pago
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
