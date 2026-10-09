"use client";

import { NotificationsActiveOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

import type { PushStatus } from "./pushContract";
import { usePushNotifications } from "./usePushNotifications";

const DESCRIPTIONS: Record<PushStatus, string> = {
  on: "Te avisaremos en este dispositivo de tus pagos, vencimientos y financiamientos.",
  off: "Recibe en este dispositivo los avisos de tus pagos, vencimientos y financiamientos.",
  denied: "Bloqueaste las notificaciones. Puedes permitirlas desde los ajustes de tu navegador o de tu teléfono.",
  "needs-install": "En iPhone, primero instala Impúlsate en tu pantalla de inicio para poder recibir notificaciones.",
  unsupported: "Este navegador no permite recibir notificaciones.",
};

type PushNotificationsCardProps = Readonly<{
  /** "banner": aviso compacto que solo aparece si se pueden activar. "card": la sección completa del perfil. */
  variant?: "banner" | "card";
}>;

export function PushNotificationsCard({ variant = "card" }: PushNotificationsCardProps) {
  const { status, busy, failed, enable, disable } = usePushNotifications();

  if (status === null) return null;

  if (variant === "banner") {
    if (status !== "off") return null;
    return (
      <Alert
        icon={<NotificationsActiveOutlined />}
        severity="info"
        action={<Button color="inherit" disabled={busy} onClick={() => void enable()} size="small">Activar</Button>}
      >
        {failed ? "No pudimos activar las notificaciones. Inténtalo nuevamente." : "Activa las notificaciones para enterarte al momento."}
      </Alert>
    );
  }

  return (
    <Card component="section" variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box
              aria-hidden="true"
              sx={{ width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%",
                bgcolor: "background.default", color: "primary.main" }}
            >
              <NotificationsActiveOutlined />
            </Box>
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
                Notificaciones
              </Typography>
              <Typography color="text.secondary" variant="body2">{DESCRIPTIONS[status]}</Typography>
            </Stack>
          </Stack>
          {(status === "on" || status === "off") && (
            <FormControlLabel
              control={(
                <Switch
                  checked={status === "on"}
                  disabled={busy}
                  onChange={(event) => void (event.target.checked ? enable() : disable())}
                />
              )}
              label={status === "on" ? "Activadas en este dispositivo" : "Desactivadas en este dispositivo"}
            />
          )}
          {failed && (
            <Alert severity="warning">No pudimos actualizar las notificaciones. Inténtalo nuevamente.</Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
