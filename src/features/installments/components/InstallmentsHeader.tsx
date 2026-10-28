import Image from "next/image";
import { Box, Typography } from "@mui/material";

import { APP_BACK_BUTTON_SIZE, AppBackButton } from "@/components/AppBackButton";
import { homeVisualTokens } from "@/features/home/homeVisualTokens";

type InstallmentsHeaderProps = Readonly<{
  title: string;
  /** Sin `backHref` no hay botón volver (p. ej. raíz de la pestaña Cuotas). */
  backHref?: string;
  backLabel?: string;
}>;

/** Cabecera de Cuotas: volver naranja a la izquierda, título centrado e isotipo a la derecha. */
export function InstallmentsHeader({
  title,
  backHref,
  backLabel = "Volver",
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
      {backHref ? <AppBackButton href={backHref} label={backLabel} /> : <Box aria-hidden="true" />}
      <Typography
        component="h1"
        sx={{
          color: homeVisualTokens.color.navy,
          fontSize: "1rem",
          fontWeight: 600,
          textAlign: "center",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </Typography>
      <Box
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
      </Box>
    </Box>
  );
}
