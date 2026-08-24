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

type AppBottomNavigationProps = Readonly<{
  activeItem: AppDestination;
}>;

export function AppBottomNavigation({
  activeItem,
}: AppBottomNavigationProps) {
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
          href="/home"
          icon={<HomeRounded />}
          label="Inicio"
          value="home"
        />
        <BottomNavigationAction
          aria-current={activeItem === "movements" ? "page" : undefined}
          component={Link}
          href="/movements"
          icon={<HistoryRounded />}
          label="Movimientos"
          value="movements"
        />
        <BottomNavigationAction
          aria-current={activeItem === "mobile-payment" ? "page" : undefined}
          component={Link}
          href="/mobile-payment"
          icon={<PaymentsOutlined />}
          label="Pago Móvil"
          value="mobile-payment"
        />
        <BottomNavigationAction
          aria-current={activeItem === "profile" ? "page" : undefined}
          component={Link}
          href="/profile"
          icon={<PersonOutlineRounded />}
          label="Perfil"
          value="profile"
        />
      </BottomNavigation>
    </Paper>
  );
}
