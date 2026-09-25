import { Box, Stack, Typography } from "@mui/material";

import { StatusLabel } from "@/features/home/components/ConsumptionCard";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";
import { PaymentPurposeIcon } from "@/features/payment-purpose/PaymentPurposeIcon";

import type { ConsumptionDetailViewModel } from "../presentation";

export const installmentsPrimary = "#4637F5";

type ConsumptionSummaryProps = Readonly<{
  header: ConsumptionDetailViewModel["header"];
}>;

/** Cabecera del consumo: concepto, cuotas, estado y capital pendiente. */
export function ConsumptionSummary({ header }: ConsumptionSummaryProps) {
  return (
    <Box
      component="section"
      aria-label={`Resumen de ${header.label}`}
      sx={{
        p: 2,
        borderRadius: `${homeVisualTokens.radius.inset}px`,
        bgcolor: homeVisualTokens.color.neutralSurface,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              bgcolor: homeVisualTokens.color.lavenderAlt,
              color: installmentsPrimary,
            }}
          >
            <PaymentPurposeIcon iconId={header.icon} sx={{ fontSize: 28 }} />
          </Box>
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h2"
              sx={{ color: homeVisualTokens.color.navy, fontWeight: 600, overflowWrap: "anywhere" }}
            >
              {header.label}
            </Typography>
            <Typography sx={{ color: homeVisualTokens.color.neutral, fontSize: "0.8125rem" }}>
              {header.installmentsSummary}
            </Typography>
          </Stack>
          <StatusLabel label={header.statusLabel} tone={header.tone} />
        </Stack>

        <Box>
          <Typography sx={{ color: homeVisualTokens.color.neutral, fontSize: "0.8125rem" }}>
            Capital pendiente
          </Typography>
          <Typography
            sx={{
              color: homeVisualTokens.color.navy,
              fontSize: "1.5rem",
              fontWeight: 800,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
            }}
          >
            {header.pendingCapital}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
