import Link from "next/link";
import { PriorityHighRounded, VerifiedRounded } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import { installmentsPrimary } from "./ConsumptionSummary";
import { pillButton } from "./StateCard";

const { color } = homeVisualTokens;

export type ReportSummaryRow = Readonly<{ label: string; value: string }>;

function Seal({ tone }: Readonly<{ tone: "success" | "error" }>) {
  const main = tone === "success" ? color.positive : color.danger;
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 112,
        height: 112,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: alpha(main, 0.2),
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: tone === "success" ? main : alpha(main, 0.9),
          color: tone === "success" ? color.navy : color.white,
        }}
      >
        {tone === "success"
          ? <VerifiedRounded sx={{ fontSize: 48 }} />
          : <PriorityHighRounded sx={{ fontSize: 48 }} />}
      </Box>
    </Box>
  );
}

function SummaryTable({ rows }: Readonly<{ rows: readonly ReportSummaryRow[] }>) {
  return (
    <Box
      component="dl"
      sx={{
        width: "100%",
        m: 0,
        px: 2,
        py: 1,
        borderRadius: `${homeVisualTokens.radius.card}px`,
        bgcolor: color.white,
      }}
    >
      {rows.map((row, index) => (
        <Stack
          direction="row"
          key={row.label}
          spacing={2}
          sx={{
            py: 0.75,
            justifyContent: "space-between",
            borderTop: index === 0 ? 0 : `1px solid ${alpha(color.navy, 0.12)}`,
          }}
        >
          <Typography component="dt" sx={{ color: color.navy, fontSize: "0.875rem", fontWeight: 400 }}>
            {row.label}
          </Typography>
          <Typography
            component="dd"
            sx={{ m: 0, color: color.navy, fontSize: "0.875rem", fontWeight: 600, textAlign: "right", overflowWrap: "anywhere" }}
          >
            {row.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

const secondaryButton = { minHeight: 48, borderRadius: 99, color: color.navy, fontSize: "1rem", fontWeight: 600 } as const;

/** Figma 18: "¡Pago reportado!" con el resumen del reporte. */
export function ReportSuccess({ rows }: Readonly<{ rows: readonly ReportSummaryRow[] }>) {
  return (
    <Stack component="section" aria-labelledby="report-success-title" spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
      <Seal tone="success" />
      <Box>
        <Typography
          component="h2"
          id="report-success-title"
          sx={{ color: color.navy, fontSize: "1.75rem", fontWeight: 700 }}
        >
          ¡Pago reportado!
        </Typography>
        <Typography sx={{ color: color.navy, fontSize: "0.9375rem" }}>
          Tu reporte fue enviado correctamente y será validado por el equipo.
        </Typography>
      </Box>
      <SummaryTable rows={rows} />
      <Typography sx={{ color: color.neutral, fontSize: "0.8125rem" }}>
        Tu cuota aparecerá como “En revisión” hasta que el pago sea aprobado.
      </Typography>
      <Stack spacing={1} sx={{ width: "100%" }}>
        <Button component={Link} fullWidth href="/installments" sx={pillButton} variant="contained">
          Ver mis cuotas
        </Button>
        <Button component={Link} fullWidth href="/home" sx={secondaryButton}>
          Volver al inicio
        </Button>
      </Stack>
    </Stack>
  );
}

type ReportFailureProps = Readonly<{
  reason: string;
  /** "Bs. 2,00": lo que se intentó reportar. */
  attemptedAmount: string | null;
  canRetry: boolean;
  detailHref: string;
  onRetry: () => void;
  supportHref?: string;
}>;

/** Sin Figma: misma plantilla que el éxito, con el motivo y el monto intentado. */
export function ReportFailure({
  reason,
  attemptedAmount,
  canRetry,
  detailHref,
  onRetry,
  supportHref,
}: ReportFailureProps) {
  return (
    <Stack
      component="section"
      aria-labelledby="report-failure-title"
      role="alert"
      spacing={2}
      sx={{ alignItems: "center", textAlign: "center" }}
    >
      <Seal tone="error" />
      <Box>
        <Typography
          component="h2"
          id="report-failure-title"
          sx={{ color: color.navy, fontSize: "1.5rem", fontWeight: 700 }}
        >
          No pudimos reportar tu pago
        </Typography>
        <Typography sx={{ mt: 0.5, color: color.navy, fontSize: "0.9375rem" }}>{reason}</Typography>
      </Box>
      {attemptedAmount && (
        <SummaryTable rows={[{ label: "Monto que intentaste reportar", value: attemptedAmount }]} />
      )}
      <Stack spacing={1} sx={{ width: "100%" }}>
        {canRetry && (
          <Button fullWidth onClick={onRetry} sx={pillButton} variant="contained">
            Intentar nuevamente
          </Button>
        )}
        {supportHref && (
          <Button
            component={Link}
            fullWidth
            href={supportHref}
            sx={{ ...secondaryButton, color: installmentsPrimary }}
          >
            Contactar a soporte
          </Button>
        )}
        <Button component={Link} fullWidth href={detailHref} sx={secondaryButton}>
          Volver a cuotas
        </Button>
      </Stack>
    </Stack>
  );
}
