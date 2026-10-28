import Link from "next/link";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";
import { PaymentPurposeIcon } from "@/features/payment-purpose/PaymentPurposeIcon";

import type { UpcomingInstallmentItem } from "../presentation";
import { installmentsPrimary } from "./ConsumptionSummary";
import { calendarStatusStyles, nextYellowBorder, visuallyHidden } from "./InstallmentSchedule";

const { color } = homeVisualTokens;
const radius = `${homeVisualTokens.radius.inset}px`;

/** Próxima cuota de un consumo: hoja de calendario a la izquierda y el consumo a la derecha. */
export function UpcomingInstallmentCard({ item }: Readonly<{ item: UpcomingInstallmentItem }>) {
  const style = calendarStatusStyles[item.status.kind];
  const isNext = item.status.kind === "next";

  const content = (
    <Stack
      direction="row"
      sx={{
        width: "100%",
        overflow: "hidden",
        textAlign: "left",
        borderRadius: radius,
        border: "2px solid",
        borderColor: style.border === "transparent" ? color.white : style.border,
        bgcolor: color.white,
        boxShadow: isNext ? `0 6px 16px ${alpha(nextYellowBorder, 0.28)}` : "none",
      }}
    >
      <Box component="span" sx={visuallyHidden}>{item.dueDateLabel}</Box>
      <Stack
        aria-hidden="true"
        sx={{ width: 72, flexShrink: 0, textAlign: "center", bgcolor: color.neutralSurface }}
      >
        <Typography
          sx={{
            py: 0.5,
            bgcolor: style.accent,
            color: style.accentText,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
          }}
        >
          {item.month}
        </Typography>
        <Typography
          sx={{
            flex: 1,
            display: "grid",
            placeItems: "center",
            py: 1,
            color: color.navy,
            fontSize: "1.875rem",
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {item.day}
        </Typography>
      </Stack>
      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, px: 1.5, py: 1.25 }} useFlexGap>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 1.5,
              bgcolor: color.lavenderAlt,
              color: installmentsPrimary,
            }}
          >
            <PaymentPurposeIcon iconId={item.icon} sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            sx={{ flex: 1, minWidth: 0, color: color.navy, fontWeight: 600, overflowWrap: "anywhere" }}
          >
            {item.label}
          </Typography>
          <Typography
            component="span"
            sx={{
              flexShrink: 0,
              px: 1,
              py: 0.25,
              borderRadius: 99,
              bgcolor: style.chipBg,
              color: style.chipColor,
              fontSize: "0.6875rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {item.status.label}
          </Typography>
        </Stack>
        <Typography sx={{ color: color.neutral, fontSize: "0.75rem", fontWeight: 400 }}>
          {item.numberLabel}
        </Typography>
        <Typography sx={{ color: color.navy, fontSize: "1.0625rem", fontWeight: 800 }}>
          {item.amount}
        </Typography>
      </Stack>
    </Stack>
  );

  if (!item.href) return content;

  return (
    <ButtonBase
      component={Link}
      href={item.href}
      sx={{
        width: "100%",
        display: "flex",
        borderRadius: radius,
        "&:focus-visible": { outline: `3px solid ${installmentsPrimary}`, outlineOffset: 2 },
      }}
    >
      {content}
    </ButtonBase>
  );
}
