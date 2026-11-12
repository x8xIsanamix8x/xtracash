import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBagOutlined } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

import { themeTokens } from "@/theme/tokens";

export type AppDestination =
  | "home"
  | "catalog"
  | "installments"
  | "purchases"
  | "movements"
  | "mobile-payment"
  | "profile";

export const APP_BOTTOM_NAVIGATION_HEIGHT = 64;
export const MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT = 80;

export const appDestinationHref: Readonly<Record<AppDestination, string>> = {
  home: "/home",
  catalog: "/marketplace",
  installments: "/installments",
  purchases: "/marketplace/compras",
  movements: "/movements",
  "mobile-payment": "/mobile-payment",
  profile: "/profile",
};

const navigationItems: readonly Readonly<{
  destination: AppDestination;
  icon: string | SvgIconComponent;
  label: string;
}>[] = [
  { destination: "home", icon: "/navigation/home.svg", label: "Inicio" },
  { destination: "installments", icon: "/navigation/cuotas.svg", label: "Cuotas" },
  { destination: "movements", icon: "/navigation/movements.svg", label: "Movimientos" },
  { destination: "profile", icon: "/navigation/profile.svg", label: "Perfil" },
];

const marketplaceNavigationItems: typeof navigationItems = [
  { destination: "home", icon: "/navigation/home.svg", label: "Inicio" },
  { destination: "installments", icon: "/navigation/cuotas.svg", label: "Cuotas" },
  { destination: "purchases", icon: ShoppingBagOutlined, label: "Mis Compras" },
  { destination: "profile", icon: "/navigation/profile.svg", label: "Perfil" },
];

type AppBottomNavigationProps = Readonly<{
  activeItem: AppDestination;
  disabled?: boolean;
  variant?: "standard" | "marketplace";
  onNavigate?: (destination: AppDestination) => boolean;
}>;

function NavigationIcon({ src, size = 24 }: Readonly<{ src: string | SvgIconComponent; size?: number }>) {
  if (typeof src !== "string") {
    const Icon = src;
    return <Icon sx={{ fontSize: size }} aria-hidden="true" />;
  }
  return (
    <Image
      alt=""
      aria-hidden="true"
      height={48}
      src={src}
      style={{ width: size, height: size, objectFit: "contain" }}
      width={48}
    />
  );
}

export function AppBottomNavigation({
  activeItem,
  disabled = false,
  variant = "standard",
  onNavigate,
}: AppBottomNavigationProps) {
  const navigationHeight = variant === "marketplace" ? MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT : APP_BOTTOM_NAVIGATION_HEIGHT;
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
        zIndex: (theme) => theme.zIndex.appBar + 1,
        right: 0,
        left: 0,
        bottom: 0,
        width: "100%",
        minHeight: `calc(${navigationHeight}px + env(safe-area-inset-bottom))`,
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
          height: navigationHeight,
          bgcolor: themeTokens.color.brandDeep,
        }}
      >
        {(variant === "marketplace" ? marketplaceNavigationItems : navigationItems).map((item) => (
          <BottomNavigationAction
            aria-current={activeItem === item.destination ? "page" : undefined}
            component={Link}
            disabled={disabled}
            href={variant === "marketplace"
              ? item.destination === "installments"
                ? "/marketplace/cuotas"
                : appDestinationHref[item.destination]
              : appDestinationHref[item.destination]}
            icon={<NavigationIcon src={item.icon} size={variant === "marketplace" ? 27 : 24} />}
            key={item.destination}
            label={item.label}
            onClick={(event) => handleNavigation(event, item.destination)}
            sx={{
              minWidth: 0,
              maxWidth: "none",
              minHeight: navigationHeight,
              p: variant === "marketplace" ? "0.55rem 0.25rem 0.45rem" : "0.45rem 0.25rem 0.35rem",
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
                fontSize: variant === "marketplace" ? "0.7rem" : "0.625rem",
                fontWeight: 500,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              },
              "& .MuiBottomNavigationAction-label.Mui-selected": {
                fontSize: variant === "marketplace" ? "0.7rem" : "0.625rem",
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
