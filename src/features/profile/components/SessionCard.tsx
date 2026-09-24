import { LogoutRounded } from "@mui/icons-material";
import { Button } from "@mui/material";

type SessionCardProps = Readonly<{
  onSignOut: () => void;
}>;

export function SessionCard({ onSignOut }: SessionCardProps) {
  return (
    <Button
      color="error"
      fullWidth
      onClick={onSignOut}
      startIcon={<LogoutRounded />}
      sx={{ minHeight: 48, borderRadius: 8 }}
      type="button"
      variant="outlined"
    >
      Cerrar sesión
    </Button>
  );
}
