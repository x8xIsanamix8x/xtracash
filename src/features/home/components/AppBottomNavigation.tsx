import { AssignmentOutlined, HomeRounded, PaymentsOutlined, PersonOutlineRounded } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";

type AppBottomNavigationProps = Readonly<{
  onUnavailable: (label: string) => void;
}>;

export function AppBottomNavigation({ onUnavailable }: AppBottomNavigationProps) {
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
      <BottomNavigation
        showLabels
        value={0}
        onChange={(_, value: number) => {
          const labels = ["Inicio", "Solicitudes", "Pagos", "Perfil"];
          if (value > 0) onUnavailable(labels[value]);
        }}
      >
        <BottomNavigationAction label="Inicio" icon={<HomeRounded />} />
        <BottomNavigationAction label="Solicitudes" icon={<AssignmentOutlined />} />
        <BottomNavigationAction label="Pagos" icon={<PaymentsOutlined />} />
        <BottomNavigationAction label="Perfil" icon={<PersonOutlineRounded />} />
      </BottomNavigation>
    </Paper>
  );
}
