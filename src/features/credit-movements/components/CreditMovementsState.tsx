import {
  AddCardRounded,
  CloudOffRounded,
  DoNotDisturbOnRounded,
  ReplayRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export type CreditMovementsViewStatus =
  | "loading"
  | "ready"
  | "error"
  | "unavailable"
  | "no-financing";

type CreditMovementsStateProps = Readonly<{
  status: Exclude<CreditMovementsViewStatus, "ready">;
  onRetry: () => void;
}>;

const reducedMotionStyles = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
} as const;

export function CreditMovementsState({
  status,
  onRetry,
}: CreditMovementsStateProps) {
  if (status === "loading") {
    return (
      <Stack
        aria-busy="true"
        aria-label="Cargando movimientos"
        aria-live="polite"
        role="status"
        spacing={2.5}
      >
        <Skeleton
          aria-hidden="true"
          height={190}
          variant="rounded"
          sx={reducedMotionStyles}
        />
        <Skeleton
          aria-hidden="true"
          height={52}
          variant="rounded"
          sx={reducedMotionStyles}
        />
        <Skeleton
          aria-hidden="true"
          height={280}
          variant="rounded"
          sx={reducedMotionStyles}
        />
      </Stack>
    );
  }

  const isError = status === "error";
  const isUnavailable = status === "unavailable";
  const StateIcon = isError
    ? CloudOffRounded
    : isUnavailable
      ? DoNotDisturbOnRounded
      : AddCardRounded;
  const title = isError
    ? "No pudimos cargar tus movimientos"
    : isUnavailable
      ? "Cuenta no disponible"
      : "Aún no tienes un financiamiento asignado";
  const description = isError
    ? "Inténtalo nuevamente para consultar la actividad de tu crédito."
    : isUnavailable
      ? "La cuenta no se encuentra habilitada en este momento. Puedes volver a consultar más tarde."
      : "Cuando tengas un financiamiento disponible, podrás consultar aquí sus movimientos.";

  return (
    <Card
      component="section"
      aria-live={isError ? "assertive" : "polite"}
      role={isError ? "alert" : "status"}
      variant="outlined"
      sx={{ minHeight: 340, display: "flex" }}
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
        <Stack
          spacing={2}
          sx={{ maxWidth: 520, alignItems: "center", textAlign: "center" }}
        >
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              width: 68,
              height: 68,
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
            <StateIcon sx={{ fontSize: 34 }} />
          </Box>
          <Stack spacing={1}>
            <Typography
              component="h2"
              variant="h5"
              sx={{ color: "secondary.main", fontWeight: 700 }}
            >
              {title}
            </Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Stack>
          {isError && (
            <Button
              onClick={onRetry}
              startIcon={<ReplayRounded />}
              type="button"
              variant="contained"
            >
              Reintentar
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
