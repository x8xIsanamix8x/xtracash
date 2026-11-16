import { Box, Stack, Typography } from "@mui/material";

import { StatusLabel } from "@/features/home/components/ConsumptionCard";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";
import { PaymentPurposeIcon } from "@/features/payment-purpose/PaymentPurposeIcon";

import type { ConsumptionDetailViewModel } from "../presentation";

export const installmentsPrimary = "#4637F5";

type ConsumptionSummaryProps = Readonly<{
  header: ConsumptionDetailViewModel["header"];
  variant?: "standard" | "marketplace";
}>;

/** Cabecera del consumo: concepto, cuotas, estado y capital pendiente. */
export function ConsumptionSummary({ header, variant = "standard" }: ConsumptionSummaryProps) {
  return (
    <Box
      component="section"
      aria-label={`Resumen de ${header.label}`}
      sx={{
        p: variant === "marketplace" ? 1.5 : 2,
        borderRadius: `${homeVisualTokens.radius.card}px`,
        bgcolor: variant === "marketplace" ? "#F1F1F1" : homeVisualTokens.color.neutralSurface,
        border: variant === "marketplace" ? "1px solid #D7D7D7" : "none",
      }}
    >
      <Stack spacing={variant === "marketplace" ? 1.1 : 2}>
        <Stack direction="row" spacing={variant === "marketplace" ? 1.25 : 1.5} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: variant === "marketplace" ? 48 : 56,
              height: variant === "marketplace" ? 48 : 56,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: homeVisualTokens.color.lavenderAlt,
              color: installmentsPrimary,
            }}
          >
            <PaymentPurposeIcon iconId={header.icon} sx={{ fontSize: variant === "marketplace" ? 24 : 28 }} />
          </Box>
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h2"
              sx={{ color: homeVisualTokens.color.navy, fontWeight: 700, overflowWrap: "anywhere" }}
            >
              {header.label}
            </Typography>
            <Typography sx={{ color: variant === "marketplace" ? "#171717" : homeVisualTokens.color.neutral, fontSize: variant === "marketplace" ? "0.88rem" : "0.8125rem" }}>
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
              fontSize: variant === "marketplace" ? "1.55rem" : "1.5rem",
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
