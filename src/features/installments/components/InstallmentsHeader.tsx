import Image from "next/image";
import Link from "next/link";
import { ArrowBackRounded, NotificationsNoneRounded } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

import { APP_BACK_BUTTON_SIZE, AppBackButton } from "@/components/AppBackButton";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";

type InstallmentsHeaderProps = Readonly<{
  title: string;
  /** Sin `backHref` no hay botón volver (p. ej. raíz de la pestaña Cuotas). */
  backHref?: string;
  backLabel?: string;
  variant?: "standard" | "marketplace";
}>;

/** Cabecera de Cuotas: volver naranja a la izquierda, título centrado e isotipo a la derecha. */
export function InstallmentsHeader({
  title,
  backHref,
  backLabel = "Volver",
  variant = "standard",
}: InstallmentsHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: "grid",
        gridTemplateColumns: `${APP_BACK_BUTTON_SIZE}px minmax(0, 1fr) ${APP_BACK_BUTTON_SIZE}px`,
        alignItems: "center",
        gap: 1,
      }}
    >
        {variant === "marketplace" ? <Box sx={{ width: APP_BACK_BUTTON_SIZE, height: APP_BACK_BUTTON_SIZE, display: "grid", placeItems: "center" }}>{backHref ? <IconButton component={Link} href={backHref} aria-label={backLabel} sx={{ color: "#171717" }}><ArrowBackRounded /></IconButton> : <Box aria-hidden="true" />}</Box> : backHref ? <AppBackButton href={backHref} label={backLabel} /> : <Box aria-hidden="true" />}
      <Typography
        component="h1"
        sx={{
          color: variant === "marketplace" ? "#2751E6" : homeVisualTokens.color.navy,
          fontSize: variant === "marketplace" ? "1.3rem" : "1rem",
          fontWeight: 600,
          textAlign: "center",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </Typography>
      {variant === "marketplace" ? <IconButton component={Link} href="/notifications" aria-label="Notificaciones" sx={{ width: APP_BACK_BUTTON_SIZE, height: APP_BACK_BUTTON_SIZE, color: "#2751E6" }}><NotificationsNoneRounded /></IconButton> : <Box
        sx={{
          width: APP_BACK_BUTTON_SIZE,
          height: APP_BACK_BUTTON_SIZE,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: homeVisualTokens.color.logoSurface,
        }}
      >
        <Image
          alt=""
          aria-hidden="true"
          height={32}
          priority
          src="/entry/isotipo-impulsa.png"
          style={{ objectFit: "contain" }}
          width={26}
        />
      </Box>}
    </Box>
  );
}
