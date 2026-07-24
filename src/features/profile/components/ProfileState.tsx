import { CloudOffRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { ProfileStatus } from "../types";

type ProfileStateProps = Readonly<{
  status: Exclude<ProfileStatus, "ready">;
  onRetry: () => void;
}>;

const reducedMotionStyles = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
} as const;

export function ProfileState({ status, onRetry }: ProfileStateProps) {
  if (status === "loading") {
    return (
      <Box
        component="section"
        aria-busy="true"
        aria-label="Cargando perfil"
        aria-live="polite"
        role="status"
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateAreas: {
            xs: '"summary" "information" "security"',
            md: '"summary information" "security information"',
          },
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.9fr) minmax(0, 1.1fr)" },
        }}
      >
        <Skeleton
          aria-hidden="true"
          animation="wave"
          height={220}
          variant="rounded"
          sx={{ gridArea: "summary", ...reducedMotionStyles }}
        />
        <Skeleton
          aria-hidden="true"
          animation="wave"
          height={260}
          variant="rounded"
          sx={{ gridArea: "security", ...reducedMotionStyles }}
        />
        <Skeleton
          aria-hidden="true"
          animation="wave"
          height={520}
          variant="rounded"
          sx={{ gridArea: "information", ...reducedMotionStyles }}
        />
      </Box>
    );
  }

  return (
    <Card
      component="section"
      aria-describedby="profile-error-description"
      aria-labelledby="profile-error-title"
      role="alert"
      variant="outlined"
      sx={{ minHeight: 360, display: "flex", boxShadow: "none" }}
    >
      <CardContent
        sx={{
          width: "100%",
          display: "grid",
          placeItems: "center",
          p: { xs: 3, sm: 5 },
          "&:last-child": { pb: { xs: 3, sm: 5 } },
        }}
      >
        <Stack spacing={2} sx={{ maxWidth: 560, alignItems: "center", textAlign: "center" }}>
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              width: 72,
              height: 72,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: "error.main",
            })}
          >
            <CloudOffRounded sx={{ width: 36, height: 36 }} />
          </Box>
          <Stack spacing={1}>
            <Typography
              component="h2"
              id="profile-error-title"
              variant="h5"
              sx={{ color: "secondary.main", fontWeight: 700 }}
            >
              No pudimos cargar tu perfil
            </Typography>
            <Typography color="text.secondary" id="profile-error-description">
              No pudimos cargar tu información. Inténtalo nuevamente.
            </Typography>
          </Stack>
          <Button fullWidth onClick={onRetry} sx={{ maxWidth: 320 }} variant="contained">
            Reintentar
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
