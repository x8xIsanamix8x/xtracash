import { AddRounded, AddCardRounded, CloudOffRounded, ReplayRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type CreditOverviewStatus = "loading" | "ready" | "error" | "empty";

type CreditOverviewStateProps = Readonly<{
  status: Exclude<CreditOverviewStatus, "ready">;
  onRequestCredit: () => void;
  onRetry: () => void;
}>;

const reducedMotionStyles = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
} as const;

function CreditOverviewSkeleton() {
  return (
    <Stack
      component="section"
      aria-busy="true"
      aria-label="Cargando resumen del crédito"
      aria-live="polite"
      role="status"
      spacing={3}
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
        }}
      >
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Skeleton
            aria-hidden="true"
            animation="wave"
            variant="rounded"
            sx={{
              width: "100%",
              maxWidth: 480,
              aspectRatio: "1.586 / 1",
              ...reducedMotionStyles,
            }}
          />
          <Skeleton
            aria-hidden="true"
            animation="wave"
            height={48}
            variant="rounded"
            sx={reducedMotionStyles}
          />
        </Stack>
        <Skeleton
          aria-hidden="true"
          animation="wave"
          variant="rounded"
          sx={{
            width: "100%",
            minHeight: { xs: 440, md: 480 },
            ...reducedMotionStyles,
          }}
        />
      </Box>
      <Skeleton
        aria-hidden="true"
        animation="wave"
        height={220}
        variant="rounded"
        sx={reducedMotionStyles}
      />
    </Stack>
  );
}

export function CreditOverviewState({
  status,
  onRequestCredit,
  onRetry,
}: CreditOverviewStateProps) {
  if (status === "loading") {
    return <CreditOverviewSkeleton />;
  }

  const isError = status === "error";
  const StateIcon = isError ? CloudOffRounded : AddCardRounded;
  const title = isError
    ? "No pudimos cargar tu crédito"
    : "Aún no tienes una línea de crédito activa";
  const description = isError
    ? "No pudimos cargar la información de tu crédito. Inténtalo nuevamente."
    : "Cuando tengas una línea disponible, podrás consultar aquí sus montos, pagos y movimientos.";
  const titleId = `credit-overview-${status}-title`;
  const descriptionId = `credit-overview-${status}-description`;

  return (
    <Card
      component="section"
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-live={isError ? "assertive" : "polite"}
      role={isError ? "alert" : "status"}
      variant="outlined"
      sx={{
        minHeight: { xs: 320, sm: 360 },
        display: "flex",
        bgcolor: "background.paper",
      }}
    >
      <CardContent
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 5 },
          "&:last-child": { pb: { xs: 3, sm: 5 } },
        }}
      >
        <Stack
          spacing={2}
          sx={{
            width: "100%",
            maxWidth: 560,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              width: 72,
              height: 72,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              color: isError ? "error.main" : "primary.main",
              bgcolor: alpha(
                isError ? theme.palette.error.main : theme.palette.primary.main,
                0.1,
              ),
            })}
          >
            <StateIcon sx={{ width: 36, height: 36 }} />
          </Box>
          <Stack spacing={1}>
            <Typography
              component="h2"
              id={titleId}
              variant="h5"
              sx={{ color: "secondary.main", fontWeight: 700 }}
            >
              {title}
            </Typography>
            <Typography color="text.secondary" id={descriptionId}>
              {description}
            </Typography>
          </Stack>
          <Button
            fullWidth
            onClick={isError ? onRetry : onRequestCredit}
            startIcon={isError ? <ReplayRounded /> : <AddRounded />}
            sx={{ maxWidth: 320 }}
            variant="contained"
          >
            {isError ? "Reintentar" : "Solicitar crédito"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
