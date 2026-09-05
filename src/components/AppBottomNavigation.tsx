import type { MouseEvent } from "react";
import Link from "next/link";
import {
  HistoryRounded,
  HomeRounded,
  PaymentsOutlined,
  PersonOutlineRounded,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";

export type AppDestination =
  | "home"
  | "movements"
  | "mobile-payment"
  | "profile";

export const APP_BOTTOM_NAVIGATION_HEIGHT = 56;

export const appDestinationHref: Readonly<Record<AppDestination, string>> = {
  home: "/home",
  movements: "/movements",
  "mobile-payment": "/mobile-payment",
  profile: "/profile",
};

type AppBottomNavigationProps = Readonly<{
  activeItem: AppDestination;
  disabled?: boolean;
  onNavigate?: (destination: AppDestination) => boolean;
}>;

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
      elevation={2}
      sx={{
        position: "fixed",
        zIndex: 10,
        left: "50%",
        bottom: 0,
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 900,
        borderRadius: { xs: 0, md: "16px 16px 0 0" },
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <BottomNavigation showLabels value={activeItem}>
        <BottomNavigationAction
          aria-current={activeItem === "home" ? "page" : undefined}
          component={Link}
          disabled={disabled}
          href={appDestinationHref.home}
          icon={<HomeRounded />}
          label="Inicio"
          onClick={(event) => handleNavigation(event, "home")}
          value="home"
        />
        <BottomNavigationAction
          aria-current={activeItem === "movements" ? "page" : undefined}
          component={Link}
          disabled={disabled}
          href={appDestinationHref.movements}
          icon={<HistoryRounded />}
          label="Movimientos"
          onClick={(event) => handleNavigation(event, "movements")}
          value="movements"
        />
        <BottomNavigationAction
          aria-current={activeItem === "mobile-payment" ? "page" : undefined}
          component={Link}
          disabled={disabled}
          href={appDestinationHref["mobile-payment"]}
          icon={<PaymentsOutlined />}
          label="Pago Móvil"
          onClick={(event) => handleNavigation(event, "mobile-payment")}
          value="mobile-payment"
        />
        <BottomNavigationAction
          aria-current={activeItem === "profile" ? "page" : undefined}
          component={Link}
          disabled={disabled}
          href={appDestinationHref.profile}
          icon={<PersonOutlineRounded />}
          label="Perfil"
          onClick={(event) => handleNavigation(event, "profile")}
          value="profile"
        />
      </BottomNavigation>
    </Paper>
  );
}
