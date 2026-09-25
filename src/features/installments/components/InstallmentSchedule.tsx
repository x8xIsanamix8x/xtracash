import { useEffect, useRef } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import type { ScheduleItem, ScheduleStatusKind } from "../presentation";
import { installmentsPrimary } from "./ConsumptionSummary";

const { color } = homeVisualTokens;

/** Ancho fijo de cada hoja (cabe "Bs. 34.372,09"), sean 1 o muchas cuotas. Si no caben, scroll. */
const CARD_WIDTH = 118;
/** Cuánto se ve de la cuota anterior al arrancar en la próxima. */
const PREVIOUS_PEEK = 32;

/** Texto solo para lectores de pantalla. */
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
  p: 0,
  m: "-1px",
} as const;

/** Próxima: amarillo (Gabriel, 25/09). Borde un tono más oscuro para que se note sobre blanco. */
const nextYellow = "#FFCD3C";
export const nextYellowBorder = "#F2B300";

export const calendarStatusStyles: Readonly<Record<ScheduleStatusKind, Readonly<{
  chipBg: string;
  chipColor: string;
  accent: string;
  accentText: string;
  border: string;
}>>> = {
  paid: { chipBg: alpha(color.positive, 0.24), chipColor: color.navy, accent: color.positive, accentText: color.navy, border: "transparent" },
  next: { chipBg: nextYellow, chipColor: color.navy, accent: nextYellow, accentText: color.navy, border: nextYellowBorder },
  pending: { chipBg: alpha(color.neutral, 0.16), chipColor: color.navy, accent: color.neutral, accentText: color.white, border: "transparent" },
  overdue: { chipBg: alpha(color.orange, 0.16), chipColor: color.navy, accent: color.orange, accentText: color.white, border: color.orange },
  late: { chipBg: alpha(color.danger, 0.14), chipColor: color.danger, accent: color.danger, accentText: color.white, border: color.danger },
  review: { chipBg: color.surfaceTint, chipColor: color.violet, accent: color.lavender, accentText: color.navy, border: "transparent" },
};

/** Una hoja de calendario: mes arriba, día grande, número de cuota, monto y estado. */
function CalendarCard({ item }: Readonly<{ item: ScheduleItem }>) {
  const style = calendarStatusStyles[item.status.kind];
  const isNext = item.status.kind === "next";

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        alignItems: "stretch",
        textAlign: "center",
        borderRadius: `${homeVisualTokens.radius.inset}px`,
        border: "2px solid",
        borderColor: style.border,
        bgcolor: isNext ? color.white : color.neutralSurface,
        boxShadow: isNext ? `0 6px 16px ${alpha(nextYellowBorder, 0.28)}` : "none",
        opacity: item.status.kind === "paid" ? 0.65 : 1,
      }}
    >
      <Box component="span" sx={visuallyHidden}>{item.dueDateLabel}</Box>
      <Typography
        aria-hidden="true"
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
      <Stack spacing={0.5} sx={{ flex: 1, px: 1, pt: 0.75, pb: 1.25, alignItems: "center" }} useFlexGap>
        <Typography
          aria-hidden="true"
          sx={{ color: color.navy, fontSize: "1.875rem", fontWeight: 800, lineHeight: 1 }}
        >
          {item.day}
        </Typography>
        <Typography sx={{ color: color.neutral, fontSize: "0.75rem", fontWeight: 400 }}>
          {item.numberLabel}
        </Typography>
        <Typography sx={{ color: color.navy, fontSize: "0.8125rem", fontWeight: 800, whiteSpace: "nowrap" }}>
          {item.amount}
        </Typography>
        <Typography
          component="span"
          sx={{
            mt: "auto",
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
        {item.paidOnLabel && (
          <Typography sx={{ color: color.neutral, fontSize: "0.6875rem" }}>{item.paidOnLabel}</Typography>
        )}
      </Stack>
    </Stack>
  );
}

type InstallmentScheduleProps = Readonly<{
  items: readonly ScheduleItem[];
  /** Si viene, las cuotas por pagar se pueden tocar (SPEC-04). */
  onSelect?: (item: ScheduleItem) => void;
}>;

/** "Tus cuotas": calendario horizontal (estilo Cashea) con scroll lateral si no caben. */
export function InstallmentSchedule({ items, onSelect }: InstallmentScheduleProps) {
  const listRef = useRef<HTMLOListElement>(null);

  // Al abrir, la fila arranca en la próxima cuota (solo scroll horizontal de la fila) y deja
  // asomar la anterior para que se note que hay cuotas a la izquierda.
  useEffect(() => {
    const list = listRef.current;
    const next = list?.querySelector<HTMLElement>("[data-next='true']");
    if (!list || !next) return;
    list.scrollLeft = Math.max(0, next.offsetLeft - list.offsetLeft - PREVIOUS_PEEK);
  }, []);

  return (
    <Box component="section" aria-labelledby="installment-schedule-title">
      <Typography
        component="h2"
        id="installment-schedule-title"
        sx={{ mb: 1.25, color: color.navy, fontSize: "1.0625rem", fontWeight: 600 }}
      >
        Tus cuotas
      </Typography>
      <Stack
        aria-labelledby="installment-schedule-title"
        component="ol"
        direction="row"
        ref={listRef}
        spacing={1}
        useFlexGap
        // Enfocable para recorrer la fila con las flechas del teclado.
        tabIndex={0}
        sx={{
          m: 0,
          px: 0.25,
          pt: 0.25,
          pb: 1.25,
          listStyle: "none",
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollSnapType: "x mandatory",
          // Cada tarjeta encaja dejando asomar la anterior.
          scrollPaddingInlineStart: `${PREVIOUS_PEEK}px`,
          "&:focus-visible": { outline: `3px solid ${installmentsPrimary}`, outlineOffset: 2, borderRadius: 2 },
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { borderRadius: 99, bgcolor: color.lavender },
        }}
      >
        {items.map((item) => (
          <Box
            component="li"
            data-next={item.status.kind === "next"}
            key={item.id}
            sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start", display: "flex" }}
          >
            {onSelect && item.isPayable ? (
              <ButtonBase
                aria-label={`${item.accessibleLabel}. Pagar`}
                onClick={() => onSelect(item)}
                sx={{
                  width: "100%",
                  alignItems: "stretch",
                  borderRadius: `${homeVisualTokens.radius.inset}px`,
                  "&:focus-visible": { outline: `3px solid ${installmentsPrimary}`, outlineOffset: 2 },
                }}
              >
                <CalendarCard item={item} />
              </ButtonBase>
            ) : (
              <CalendarCard item={item} />
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
