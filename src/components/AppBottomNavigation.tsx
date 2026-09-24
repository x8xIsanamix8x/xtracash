import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

export type AppDestination =
  | "home"
  | "movements"
  | "mobile-payment"
  | "profile";

export const APP_BOTTOM_NAVIGATION_HEIGHT = 64;

export const appDestinationHref: Readonly<Record<AppDestination, string>> = {
  home: "/home",
  movements: "/movements",
  "mobile-payment": "/mobile-payment",
  profile: "/profile",
};

const navigationItems: readonly Readonly<{
  destination: AppDestination;
  icon: string;
  label: string;
}>[] = [
  { destination: "home", icon: "/navigation/home.svg", label: "Inicio" },
  { destination: "mobile-payment", icon: "/navigation/cuotas.svg", label: "Cuotas" },
  { destination: "movements", icon: "/navigation/movements.svg", label: "Movimientos" },
  { destination: "profile", icon: "/navigation/profile.svg", label: "Perfil" },
];

type AppBottomNavigationProps = Readonly<{
  activeItem: AppDestination;
  disabled?: boolean;
  onNavigate?: (destination: AppDestination) => boolean;
}>;

function NavigationIcon({ src }: Readonly<{ src: string }>) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      height={48}
      src={src}
      style={{ width: 24, height: 24, objectFit: "contain" }}
      width={48}
    />
  );
}

export function AppBottomNavigation({
  activeItem,
  disabled = false,
  onNavigate,
}: AppBottomNavigationProps) {
  const handleNavigation = (
    event: MouseEvent<HTMLElement>,
    destination: AppDestination,
  ) => {
    if (disabled || onNavigate?.(destination) === false) {
      event.preventDefault();
    }
  };

  return (
    <Paper
      component="nav"
      aria-label="Navegación principal"
      elevation={0}
      sx={{
        position: "fixed",
        zIndex: (theme) => theme.zIndex.appBar,
        right: 0,
        left: 0,
        bottom: 0,
        width: "100%",
        maxWidth: 900,
        mx: "auto",
        borderRadius: 0,
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        bgcolor: themeTokens.color.brandDeep,
        pb: "env(safe-area-inset-bottom)",
        overflow: "hidden",
      }}
    >
      <BottomNavigation
        showLabels
        value={activeItem}
        sx={{
          height: APP_BOTTOM_NAVIGATION_HEIGHT,
          bgcolor: themeTokens.color.brandDeep,
        }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            aria-current={activeItem === item.destination ? "page" : undefined}
            component={Link}
            disabled={disabled}
            href={appDestinationHref[item.destination]}
            icon={<NavigationIcon src={item.icon} />}
            key={item.destination}
            label={item.label}
            onClick={(event) => handleNavigation(event, item.destination)}
            sx={{
              minWidth: 0,
              maxWidth: "none",
              minHeight: APP_BOTTOM_NAVIGATION_HEIGHT,
              p: "0.45rem 0.25rem 0.35rem",
              color: "common.white",
              opacity: 0.72,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
              "&:active": { bgcolor: "rgba(255, 255, 255, 0.1)" },
              "&:focus-visible": {
                outline: "3px solid #FFFFFF",
                outlineOffset: -4,
              },
              "&.Mui-selected": {
                color: "common.white",
                opacity: 1,
              },
              "&.Mui-disabled": {
                color: "common.white",
                opacity: 0.35,
              },
              "& .MuiBottomNavigationAction-label": {
                mt: 0.25,
                fontSize: "0.625rem",
                fontWeight: 500,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              },
              "& .MuiBottomNavigationAction-label.Mui-selected": {
                fontSize: "0.625rem",
                fontWeight: 700,
              },
            }}
            value={item.destination}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
