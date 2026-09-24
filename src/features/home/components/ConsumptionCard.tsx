import Link from "next/link";
import {
  CheckCircleRounded,
  HourglassTopRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PaymentPurposeIcon } from "@/features/payment-purpose/PaymentPurposeIcon";
import type { HomeConsumptionIconName, HomeStatusTone } from "../newBusinessTypes";
import { homeVisualTokens } from "../homeVisualTokens";

/** `info` = pago en revisión (solo en Mis cuotas). */
export type ConsumptionCardTone = HomeStatusTone | "info";

export type ConsumptionCardItem = Readonly<{
  id: string;
  icon: HomeConsumptionIconName;
  label: string;
  amount: string | null;
  installmentProgress: string;
  /** `null` oculta la barra (no se conoce el total de cuotas). */
  progress: number | null;
  nextPaymentDate: string | null;
  nextPaymentAmount: string | null;
  /** P. ej. "Cuota 1": se antepone a la fecha de la próxima cuota. */
  nextPaymentLabel?: string | null;
  statusLabel: string;
  tone: ConsumptionCardTone;
}>;

type ConsumptionCardProps = Readonly<{
  item: ConsumptionCardItem;
  /** Con `href` toda la card es un enlace. */
  href?: string;
  /** Resalta la card como la próxima obligación, con este texto (p. ej. "Próxima"). */
  highlightLabel?: string;
}>;

const highlightColor = "#4637F5";

function isDanger(item: Pick<ConsumptionCardItem, "statusLabel">) {
  return item.statusLabel === "En mora";
}

export function StatusLabel({
  label,
  tone,
}: Readonly<{ label: string; tone: ConsumptionCardTone }>) {
  const positive = tone === "positive";
  const info = tone === "info";
  const danger = isDanger({ statusLabel: label });

  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      sx={{
        minHeight: 28,
        width: "fit-content",
        maxWidth: "100%",
        flexShrink: 0,
        px: 1,
        alignItems: "center",
        borderRadius: 99,
        bgcolor: positive
          ? alpha(homeVisualTokens.color.positive, 0.24)
          : info
            ? homeVisualTokens.color.surfaceTint
            : danger
              ? alpha(homeVisualTokens.color.danger, 0.14)
              : alpha(homeVisualTokens.color.orange, 0.14),
        color: danger ? homeVisualTokens.color.danger : homeVisualTokens.color.navy,
      }}
    >
      {positive ? (
        <CheckCircleRounded aria-hidden="true" sx={{ fontSize: 18 }} />
      ) : info ? (
        <HourglassTopRounded
          aria-hidden="true"
          sx={{ color: homeVisualTokens.color.violet, fontSize: 18 }}
        />
      ) : (
        <WarningAmberRounded
          aria-hidden="true"
          sx={{
            color: danger ? homeVisualTokens.color.danger : homeVisualTokens.color.orange,
            fontSize: 18,
          }}
        />
      )}
      <Typography
        component="span"
        sx={{ fontSize: "0.8125rem", fontWeight: 700, lineHeight: 1.2 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function progressColor(item: ConsumptionCardItem) {
  if (item.tone === "positive" || item.tone === "info") return homeVisualTokens.color.violet;
  return isDanger(item) ? homeVisualTokens.color.danger : homeVisualTokens.color.orange;
}

function ConsumptionCardBody({
  item,
  highlightLabel,
}: Readonly<{ item: ConsumptionCardItem; highlightLabel?: string }>) {
  const nextPaymentDate = item.nextPaymentDate && item.nextPaymentLabel
    ? `${item.nextPaymentLabel} · ${item.nextPaymentDate}`
    : item.nextPaymentDate;

  return (
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              bgcolor: homeVisualTokens.color.neutralSurface,
              color: homeVisualTokens.color.violet,
            }}
          >
            <PaymentPurposeIcon iconId={item.icon} sx={{ fontSize: 28 }} />
          </Box>
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h3"
              sx={{
                color: homeVisualTokens.color.navy,
                fontWeight: 800,
                overflowWrap: "anywhere",
              }}
            >
              {item.label}
            </Typography>
            {item.amount && (
              <Typography sx={{ color: homeVisualTokens.color.neutral, fontSize: "0.875rem" }}>
                {item.amount}
              </Typography>
            )}
          </Stack>
          <StatusLabel label={item.statusLabel} tone={item.tone} />
        </Stack>

        <Stack spacing={0.75}>
          {item.progress !== null && (
            <LinearProgress
              aria-label={`Progreso de cuotas de ${item.label}: ${item.installmentProgress}`}
              value={item.progress}
              variant="determinate"
              sx={{
                height: 7,
                borderRadius: 99,
                bgcolor: homeVisualTokens.color.lavender,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 99,
                  bgcolor: progressColor(item),
                },
              }}
            />
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Typography sx={{ color: homeVisualTokens.color.neutral, fontSize: "0.8125rem" }}>
              {item.installmentProgress}
            </Typography>
            {(nextPaymentDate || item.nextPaymentAmount) && (
              <Stack spacing={0.25} sx={{ alignItems: "flex-end", textAlign: "right" }}>
                {highlightLabel && (
                  <Typography
                    component="span"
                    sx={{
                      px: 1,
                      borderRadius: 99,
                      bgcolor: highlightColor,
                      color: homeVisualTokens.color.white,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      lineHeight: 1.6,
                    }}
                  >
                    {highlightLabel}
                  </Typography>
                )}
                {item.nextPaymentAmount && (
                  <Typography
                    sx={{ color: homeVisualTokens.color.navy, fontSize: "0.8125rem", fontWeight: 800 }}
                  >
                    {item.nextPaymentAmount}
                  </Typography>
                )}
                {nextPaymentDate && (
                  <Typography
                    sx={{ color: homeVisualTokens.color.navy, fontSize: "0.8125rem", fontWeight: 800 }}
                  >
                    {nextPaymentDate}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </CardContent>
  );
}

export function ConsumptionCard({ item, href, highlightLabel }: ConsumptionCardProps) {
  const highlighted = Boolean(highlightLabel);

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        borderWidth: highlighted ? 2 : 1,
        borderColor: highlighted
          ? highlightColor
          : alpha(homeVisualTokens.color.violet, 0.12),
        borderRadius: `${homeVisualTokens.radius.card}px`,
        bgcolor: homeVisualTokens.color.white,
        boxShadow: `0 8px 22px ${alpha(homeVisualTokens.color.black, 0.06)}`,
      }}
    >
      {href ? (
        <CardActionArea
          component={Link}
          href={href}
          sx={{
            "&:focus-visible": {
              outline: `3px solid ${highlightColor}`,
              outlineOffset: -3,
            },
          }}
        >
          <ConsumptionCardBody highlightLabel={highlightLabel} item={item} />
        </CardActionArea>
      ) : (
        <ConsumptionCardBody highlightLabel={highlightLabel} item={item} />
      )}
    </Card>
  );
}
