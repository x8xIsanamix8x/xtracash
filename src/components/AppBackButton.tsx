import Link from "next/link";
import { ChevronLeftRounded } from "@mui/icons-material";
import { IconButton } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

/** Mismo tamaño en todas las pestañas (y área táctil de 44 px). */
export const APP_BACK_BUTTON_SIZE = 44;

type AppBackButtonProps = Readonly<{
  label: string;
  disabled?: boolean;
}> & (
  | Readonly<{ href: string; onClick?: never }>
  | Readonly<{ onClick: () => void; href?: never }>
);

const backButtonSx = {
  width: APP_BACK_BUTTON_SIZE,
  height: APP_BACK_BUTTON_SIZE,
  flexShrink: 0,
  borderRadius: "12px",
  bgcolor: themeTokens.color.accent,
  color: themeTokens.color.onDark,
  "&:hover, &:active": { bgcolor: themeTokens.color.accent },
  "&.Mui-disabled": { bgcolor: themeTokens.color.accent, color: themeTokens.color.onDark, opacity: 0.5 },
  "&:focus-visible": {
    outline: `3px solid ${themeTokens.color.preLoginNavy}`,
    outlineOffset: 2,
  },
} as const;

/** Volver de las pestañas: cuadro naranja, siempre a la izquierda de la cabecera. */
export function AppBackButton({ label, disabled = false, href, onClick }: AppBackButtonProps) {
  if (href) {
    return (
      <IconButton aria-label={label} component={Link} href={href} sx={backButtonSx}>
        <ChevronLeftRounded />
      </IconButton>
    );
  }

  return (
    <IconButton aria-label={label} disabled={disabled} onClick={onClick} sx={backButtonSx} type="button">
      <ChevronLeftRounded />
    </IconButton>
  );
}
