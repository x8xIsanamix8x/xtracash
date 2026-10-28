import { LockClockRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type SessionExpiredViewProps = Readonly<{
  onSignIn: () => void;
}>;

export function SessionExpiredView({ onSignIn }: SessionExpiredViewProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        pt: "calc(24px + env(safe-area-inset-top))",
        pr: "calc(16px + env(safe-area-inset-right))",
        pb: "calc(24px + env(safe-area-inset-bottom))",
        pl: "calc(16px + env(safe-area-inset-left))",
      }}
    >
      <Container disableGutters maxWidth="sm">
        <Card
          aria-describedby="session-expired-description"
          aria-labelledby="session-expired-title"
          component="section"
          role="alert"
          variant="outlined"
          sx={{ boxShadow: "none" }}
        >
          <CardContent
            sx={{
              p: { xs: 3, sm: 5 },
              "&:last-child": { pb: { xs: 3, sm: 5 } },
            }}
          >
            <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center" }}>
              <Box
                aria-hidden="true"
                sx={(theme) => ({
                  width: 72,
                  height: 72,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                })}
              >
                <LockClockRounded sx={{ width: 36, height: 36 }} />
              </Box>
              <Stack spacing={1}>
                <Typography
                  component="h1"
                  id="session-expired-title"
                  variant="h4"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Tu sesión ha expirado
                </Typography>
                <Typography color="text.secondary" id="session-expired-description">
                  Por seguridad, vuelve a iniciar sesión para continuar.
                </Typography>
              </Stack>
              <Button
                autoFocus
                fullWidth
                onClick={onSignIn}
                sx={{ maxWidth: 320 }}
                type="button"
                variant="contained"
              >
                Volver a iniciar sesión
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
