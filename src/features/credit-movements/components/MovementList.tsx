import {
  FilterAltOffRounded,
  HistoryRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PaymentPurposeIcon } from "@/features/payment-purpose/PaymentPurposeIcon";
import { normalizePaymentIconId } from "@/features/mobile-payment/paymentPurpose";

import type { CreditMovementMonthGroup } from "../types";

type MovementListProps = Readonly<{
  groups: readonly CreditMovementMonthGroup[];
  isFiltered: boolean;
  variant?: "standard" | "marketplace";
}>;

export function MovementList({ groups, isFiltered, variant = "standard" }: MovementListProps) {
  const isMarketplace = variant === "marketplace";
  if (groups.length === 0) {
    const EmptyIcon = isFiltered ? FilterAltOffRounded : HistoryRounded;

    return (
      <Stack
        aria-live="polite"
        role="status"
        spacing={1.5}
        sx={(theme) => ({
          px: { xs: 2, sm: 3 },
          py: { xs: 4, sm: 5 },
          alignItems: "center",
          borderRadius: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.07),
          textAlign: "center",
        })}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: 56,
            height: 56,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
          })}
        >
          <EmptyIcon sx={{ fontSize: 30 }} />
        </Box>
        <Typography
          component="h3"
          variant="h6"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          {isFiltered
            ? "No hay movimientos con estos filtros"
            : "Aún no tienes movimientos recientes"}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {isFiltered
            ? "Prueba con otro tipo o estado para consultar el historial disponible."
            : "Cuando tengas actividad en tu crédito, aparecerá en esta sección."}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={isMarketplace ? 1.5 : 3.5} sx={isMarketplace ? { bgcolor: "#fff", borderRadius: "20px 20px 0 0", mx: -2, px: 2, pt: 1.5, minHeight: "60vh" } : undefined}>
      {groups.map((month) => (
        <Box
          component="section"
          aria-labelledby={`movement-month-${month.month}`}
          key={month.month}
        >
          {!isMarketplace && <Typography
            component="h3"
            id={`movement-month-${month.month}`}
            variant="h6"
            sx={{ mb: 1.5, color: "secondary.main", fontWeight: 800 }}
          >
            {month.label}
          </Typography>}

          <Stack spacing={2.5}>
            {month.days.map((day) => (
              <Box
                component="section"
                aria-labelledby={`movement-day-${day.date}`}
                key={day.date}
              >
                <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                  component="h4"
                  id={`movement-day-${day.date}`}
                  sx={{
                    mb: 0,
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                  }}
                >
                  {day.label}
                </Typography>
                </Stack>
                <Card sx={{ border: 0, bgcolor: "transparent", boxShadow: "none" }}>
                  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                    <List disablePadding aria-label={`Movimientos del ${day.label}`}>
                      {day.items.map((item, index) => {
                        const iconId = item.type === "REPORTE_PAGO"
                          ? "receipt"
                          : normalizePaymentIconId(item.icon) ?? "receipt";

                        return (
                          <ListItem
                            alignItems="flex-start"
                            divider={false}
                            key={item.id}
                            sx={isMarketplace ? {
                              display: "grid",
                              gridTemplateColumns: "32px minmax(0, 1fr) auto",
                              alignItems: "center",
                              columnGap: 1.25,
                              mb: index < day.items.length - 1 ? 1 : 0,
                              px: 1.25,
                              py: 1.25,
                              minHeight: 66,
                              border: "1px solid #DADAE4",
                              borderRadius: "18px",
                              bgcolor: "#fff",
                            } : {
                              display: "grid",
                              gridTemplateColumns: "48px minmax(0, 1fr) minmax(120px, 160px)",
                              columnGap: { xs: 1.5, sm: 2 },
                              mb: index < day.items.length - 1 ? 1.5 : 0,
                              px: { xs: 1.5, sm: 2 },
                              py: 1.75,
                              borderRadius: 1.5,
                              bgcolor: "#F2F2F2",
                            }}
                          >
                            <ListItemAvatar
                              sx={{ minWidth: isMarketplace ? 32 : 48, mt: 0 }}
                            >
                              <Avatar
                                sx={(theme) => ({
                                  width: isMarketplace ? 30 : 48,
                                  height: isMarketplace ? 30 : 48,
                                  borderRadius: isMarketplace ? "50%" : 1.5,
                                  bgcolor: isMarketplace ? "transparent" : alpha(theme.palette.primary.main, 0.12),
                                  color: "primary.main",
                                })}
                              >
                                <PaymentPurposeIcon
                                  iconId={iconId}
                                  aria-hidden="true"
                                  sx={{ fontSize: isMarketplace ? 22 : 23 }}
                                />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={item.displayTitle}
                              secondary={isMarketplace ? item.amount : item.type === "REPORTE_PAGO" ? item.counterparty : undefined}
                              sx={{ minWidth: 0, my: 0, mr: 1 }}
                              slotProps={{
                                primary: {
                                  sx: {
                                    color: "#141414",
                                    fontSize: isMarketplace ? "0.82rem" : undefined,
                                    lineHeight: isMarketplace ? 1.2 : undefined,
                                    fontWeight: isMarketplace ? 500 : 700,
                                    overflowWrap: "anywhere",
                                  },
                                },
                                secondary: {
                                  component: "div",
                                  sx: { color: "#151515", fontSize: isMarketplace ? "0.88rem" : "0.95rem", lineHeight: 1.25, fontWeight: isMarketplace ? 800 : undefined, fontVariantNumeric: "tabular-nums" },
                                },
                              }}
                            />
                            <Stack spacing={0.5} sx={{ alignItems: "flex-end", textAlign: "right" }}>
                              <Chip
                                label={item.statusLabel}
                                size="small"
                                sx={(theme) => ({
                                  height: isMarketplace ? 22 : 28,
                                  borderRadius: isMarketplace ? "6px" : 99,
                                  fontSize: isMarketplace ? "0.68rem" : undefined,
                                  px: isMarketplace ? 0.25 : undefined,
                                  color: item.status === "APROBADO"
                                    ? theme.palette.success.dark
                                    : item.status === "RECHAZADO"
                                      ? theme.palette.error.main
                                      : theme.palette.warning.dark,
                                  bgcolor: item.status === "APROBADO"
                                    ? alpha(theme.palette.success.main, 0.2)
                                    : item.status === "RECHAZADO"
                                      ? alpha(theme.palette.error.main, 0.1)
                                      : alpha(theme.palette.warning.main, 0.18),
                                  fontWeight: 700,
                                })}
                              />
                              {!isMarketplace && <Typography
                                sx={{
                                  maxWidth: { xs: 140, sm: "none" },
                                  color: "text.primary",
                                  fontSize: { xs: "0.875rem", sm: "1rem" },
                                  fontVariantNumeric: "tabular-nums",
                                  fontWeight: 800,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {item.amount}
                              </Typography>}
                              {!isMarketplace && <Typography
                                color="text.secondary"
                                variant="caption"
                                sx={{ fontVariantNumeric: "tabular-nums" }}
                              >
                                {item.displayDate}
                              </Typography>}
                            </Stack>
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
