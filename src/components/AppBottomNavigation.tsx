import Link from "next/link";
import {
  AssignmentOutlined,
  HomeRounded,
  PaymentsOutlined,
  PersonOutlineRounded,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";

export type AppDestination = "home" | "profile";

type AppBottomNavigationProps = Readonly<{
  activeItem: AppDestination;
  onUnavailable: (label: string) => void;
}>;

export function AppBottomNavigation({
  activeItem,
  onUnavailable,
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
          icon={<AssignmentOutlined />}
          label="Solicitudes"
          onClick={() => onUnavailable("Solicitudes")}
          value="requests"
        />
        <BottomNavigationAction
          icon={<PaymentsOutlined />}
          label="Pagos"
          onClick={() => onUnavailable("Pagos")}
          value="payments"
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
