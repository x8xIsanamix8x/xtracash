import {
  CancelOutlined,
  CheckCircleOutlineRounded,
  FilterAltOffRounded,
  HistoryRounded,
  ScheduleRounded,
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

import type {
  CreditMovementMonthGroup,
  CreditMovementStatus,
} from "../types";

type MovementListProps = Readonly<{
  groups: readonly CreditMovementMonthGroup[];
  isFiltered: boolean;
}>;

const movementVisuals: Record<
  CreditMovementStatus,
  Readonly<{
    icon: typeof CheckCircleOutlineRounded;
    tone: "success" | "primary" | "error";
  }>
> = {
  APROBADO: { icon: CheckCircleOutlineRounded, tone: "success" },
  PENDIENTE: { icon: ScheduleRounded, tone: "primary" },
  RECHAZADO: { icon: CancelOutlined, tone: "error" },
};

export function MovementList({ groups, isFiltered }: MovementListProps) {
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
    <Stack spacing={3.5}>
      {groups.map((month) => (
        <Box
          component="section"
          aria-labelledby={`movement-month-${month.month}`}
          key={month.month}
        >
          <Typography
            component="h3"
            id={`movement-month-${month.month}`}
            variant="h6"
            sx={{ mb: 1.5, color: "secondary.main", fontWeight: 800 }}
          >
            {month.label}
          </Typography>

          <Stack spacing={2.5}>
            {month.days.map((day) => (
              <Box
                component="section"
                aria-labelledby={`movement-day-${day.date}`}
                key={day.date}
              >
                <Typography
                  component="h4"
                  id={`movement-day-${day.date}`}
                  sx={{
                    mb: 1,
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                  }}
                >
                  {day.label}
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                    <List disablePadding aria-label={`Movimientos del ${day.label}`}>
                      {day.items.map((item, index) => {
                        const visual = movementVisuals[item.status];
                        const MovementIcon = visual.icon;
                        const rejectionReason = item.status === "RECHAZADO"
                          ? item.rejectionReason?.trim()
                          : null;

                        return (
                          <ListItem
                            alignItems="flex-start"
                            divider={index < day.items.length - 1}
                            key={item.id}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "auto minmax(0, 1fr) auto",
                              px: { xs: 1.5, sm: 2 },
                              py: 1.5,
                            }}
                          >
                            <ListItemAvatar
                              sx={{ minWidth: { xs: 48, sm: 56 }, mt: 0.25 }}
                            >
                              <Avatar
                                sx={(theme) => ({
                                  width: 40,
                                  height: 40,
                                  bgcolor: alpha(
                                    theme.palette[visual.tone].main,
                                    0.1,
                                  ),
                                  color: `${visual.tone}.main`,
                                })}
                              >
                                <MovementIcon
                                  aria-hidden="true"
                                  sx={{ fontSize: 23 }}
                                />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={item.counterparty}
                              secondary={(
                                <Stack
                                  component="span"
                                  spacing={0.6}
                                  sx={{ mt: 0.25 }}
                                >
                                  <Typography
                                    color="text.secondary"
                                    component="span"
                                    variant="body2"
                                  >
                                    {item.typeLabel}
                                  </Typography>
                                  <Box component="span">
                                    <Chip
                                      color={visual.tone}
                                      label={item.statusLabel}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 24, fontWeight: 700 }}
                                    />
                                  </Box>
                                  {rejectionReason && (
                                    <Typography
                                      color="error.main"
                                      component="span"
                                      variant="caption"
                                      sx={{
                                        display: "-webkit-box",
                                        overflow: "hidden",
                                        overflowWrap: "anywhere",
                                        WebkitBoxOrient: "vertical",
                                        WebkitLineClamp: 3,
                                      }}
                                    >
                                      Motivo: {rejectionReason}
                                    </Typography>
                                  )}
                                  <Typography
                                    color="text.secondary"
                                    component="span"
                                    variant="caption"
                                    sx={{ fontVariantNumeric: "tabular-nums" }}
                                  >
                                    {item.displayDate}
                                  </Typography>
                                </Stack>
                              )}
                              sx={{ minWidth: 0, my: 0, mr: 1 }}
                              slotProps={{
                                primary: {
                                  sx: {
                                    color: "secondary.main",
                                    fontWeight: 700,
                                    overflowWrap: "anywhere",
                                  },
                                },
                                secondary: { component: "div" },
                              }}
                            />
                            <Typography
                              sx={{
                                maxWidth: { xs: 112, sm: "none" },
                                mt: 0.25,
                                color: "text.primary",
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                fontVariantNumeric: "tabular-nums",
                                fontWeight: 800,
                                overflowWrap: "anywhere",
                                textAlign: "right",
                              }}
                            >
                              {item.amount}
                            </Typography>
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
