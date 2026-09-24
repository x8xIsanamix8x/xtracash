import Image from "next/image";
import Link from "next/link";
import { ChevronLeftRounded } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

type InstallmentsHeaderProps = Readonly<{
  title: string;
  /** Sin `backHref` no hay botón volver (p. ej. raíz de la pestaña Cuotas). */
  backHref?: string;
  backLabel?: string;
}>;

const controlSize = 42;

/** Cabecera de Cuotas (Figma 13/14): isotipo, título centrado y volver naranja. */
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
        gridTemplateColumns: `${controlSize}px minmax(0, 1fr) ${controlSize}px`,
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: controlSize,
          height: controlSize,
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
      <Typography
        component="h1"
        sx={{
          color: homeVisualTokens.color.navy,
          fontSize: "1rem",
          fontWeight: 700,
          textAlign: "center",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </Typography>
      {backHref ? (
        <IconButton
          aria-label={backLabel}
          component={Link}
          href={backHref}
          sx={{
            width: controlSize,
            height: controlSize,
            borderRadius: 2,
            bgcolor: homeVisualTokens.color.orange,
            color: homeVisualTokens.color.white,
            "&:hover, &:active": { bgcolor: homeVisualTokens.color.orange },
            "&:focus-visible": {
              outline: `3px solid ${homeVisualTokens.color.navy}`,
              outlineOffset: 2,
            },
          }}
        >
          <ChevronLeftRounded />
        </IconButton>
      ) : (
        <Box aria-hidden="true" />
      )}
    </Box>
  );
}
