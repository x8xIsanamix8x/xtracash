import { NotificationsNoneRounded, PersonOutlineRounded } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

type AppHeaderProps = Readonly<{
  firstName: string;
  onNotifications: () => void;
  onProfile: () => void;
}>;

export function AppHeader({ firstName, onNotifications, onProfile }: AppHeaderProps) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          sx={{ color: themeTokens.color.brandLogo, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          XtraCash
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton aria-label="Ver notificaciones" onClick={onNotifications}>
            <NotificationsNoneRounded />
          </IconButton>
          <IconButton aria-label="Ver perfil" onClick={onProfile}>
            <PersonOutlineRounded />
          </IconButton>
        </Stack>
      </Stack>
      <Stack spacing={0.5}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
          Hola, {firstName}
        </Typography>
        <Typography color="text.secondary">Este es el estado de tu crédito</Typography>
      </Stack>
    </Stack>
  );
}
