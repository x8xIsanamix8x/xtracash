import { LogoutRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type SessionCardProps = Readonly<{
  onSignOut: () => void;
}>;

export function SessionCard({ onSignOut }: SessionCardProps) {
  return (
    <Card component="section" variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Sesión
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.error.main, 0.08),
                color: "error.main",
              })}
            >
              <LogoutRounded />
            </Box>
            <Typography color="text.secondary" variant="body2">
              Cierra tu sesión de forma segura en este dispositivo.
            </Typography>
          </Stack>
          <Button
            color="error"
            fullWidth
            onClick={onSignOut}
            startIcon={<LogoutRounded />}
            type="button"
            variant="outlined"
          >
            Cerrar sesión
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
