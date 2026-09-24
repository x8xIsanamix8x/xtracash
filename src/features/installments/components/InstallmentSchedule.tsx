import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import type { ScheduleItem, ScheduleStatusKind } from "../presentation";
import { installmentsPrimary } from "./ConsumptionSummary";

const { color } = homeVisualTokens;

/** Texto solo para lectores de pantalla. */
const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
  p: 0,
  m: -1,
} as const;

const statusStyles: Readonly<Record<ScheduleStatusKind, Readonly<{
  chipBg: string;
  chipColor: string;
  accent: string;
  border: string;
}>>> = {
  paid: { chipBg: alpha(color.positive, 0.24), chipColor: color.navy, accent: color.positive, border: "transparent" },
  next: { chipBg: installmentsPrimary, chipColor: color.white, accent: installmentsPrimary, border: installmentsPrimary },
  pending: { chipBg: color.navy, chipColor: color.white, accent: color.navy, border: "transparent" },
  overdue: { chipBg: alpha(color.orange, 0.16), chipColor: color.navy, accent: color.orange, border: color.orange },
  late: { chipBg: alpha(color.danger, 0.14), chipColor: color.danger, accent: color.danger, border: color.danger },
  review: { chipBg: color.surfaceTint, chipColor: color.violet, accent: color.lavender, border: "transparent" },
};

function CalendarDate({ day, month, accent }: Readonly<{ day: string; month: string; accent: string }>) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 52,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 1.5,
        bgcolor: color.white,
        boxShadow: `0 2px 6px ${alpha(color.black, 0.08)}`,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          py: 0.25,
          bgcolor: accent,
          color: accent === color.lavender || accent === color.positive ? color.navy : color.white,
          fontSize: "0.6875rem",
          fontWeight: 800,
          letterSpacing: "0.06em",
        }}
      >
        {month}
      </Typography>
      <Typography sx={{ py: 0.25, color: color.navy, fontSize: "1.375rem", fontWeight: 800, lineHeight: 1.3 }}>
        {day}
      </Typography>
    </Box>
  );
}

function ScheduleRow({ item }: Readonly<{ item: ScheduleItem }>) {
  const style = statusStyles[item.status.kind];
  const muted = item.status.kind === "paid";

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        width: "100%",
        p: 1.25,
        alignItems: "center",
        textAlign: "left",
        borderRadius: `${homeVisualTokens.radius.inset}px`,
        border: "2px solid",
        borderColor: style.border,
        bgcolor: item.status.kind === "next" ? color.white : color.neutralSurface,
        opacity: muted ? 0.65 : 1,
      }}
    >
      <CalendarDate accent={style.accent} day={item.day} month={item.month} />
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        <Box component="span" sx={visuallyHidden}>{item.dueDateLabel}</Box>
        <Typography sx={{ color: color.neutral, fontSize: "0.75rem", fontWeight: 700 }}>
          {item.numberLabel}
        </Typography>
        <Typography sx={{ color: color.navy, fontSize: "1rem", fontWeight: 800, overflowWrap: "anywhere" }}>
          {item.amount}
        </Typography>
        {item.paidOnLabel && (
          <Typography sx={{ color: color.neutral, fontSize: "0.75rem" }}>{item.paidOnLabel}</Typography>
        )}
        {item.status.kind === "review" && (
          <Typography sx={{ color: color.violet, fontSize: "0.75rem" }}>
            Tu pago está en validación
          </Typography>
        )}
      </Stack>
      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          px: 1.25,
          py: 0.25,
          borderRadius: 99,
          bgcolor: style.chipBg,
          color: style.chipColor,
          fontSize: "0.75rem",
          fontWeight: 700,
        }}
      >
        {item.status.label}
      </Typography>
    </Stack>
  );
}

type InstallmentScheduleProps = Readonly<{
  items: readonly ScheduleItem[];
  /** Si viene, las cuotas por pagar se pueden tocar (SPEC-04). */
  onSelect?: (item: ScheduleItem) => void;
}>;

export function InstallmentSchedule({ items, onSelect }: InstallmentScheduleProps) {
  return (
    <Box component="section" aria-labelledby="installment-schedule-title">
      <Typography
        component="h2"
        id="installment-schedule-title"
        sx={{ mb: 1.25, color: color.navy, fontSize: "1.0625rem", fontWeight: 800 }}
      >
        Tus cuotas
      </Typography>
      <Stack component="ol" spacing={1} sx={{ m: 0, p: 0, listStyle: "none" }}>
        {items.map((item) => (
          <li key={item.id}>
            {onSelect && item.isPayable ? (
              <ButtonBase
                aria-label={`${item.accessibleLabel}. Pagar`}
                onClick={() => onSelect(item)}
                sx={{
                  width: "100%",
                  borderRadius: `${homeVisualTokens.radius.inset}px`,
                  "&:focus-visible": { outline: `3px solid ${installmentsPrimary}`, outlineOffset: 2 },
                }}
              >
                <ScheduleRow item={item} />
              </ButtonBase>
            ) : (
              <ScheduleRow item={item} />
            )}
          </li>
        ))}
      </Stack>
    </Box>
  );
}
