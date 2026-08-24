import type { Ref } from "react";
import {
  CloudOffRounded,
  CloseRounded,
  InfoOutlined,
  ReplayRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

type PaymentReportDataStateProps = Readonly<{
  status: "error" | "loading" | "unconfigured";
  titleRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
  onRetry: () => void;
}>;

export function PaymentReportDataState({
  status,
  titleRef,
  onClose,
  onRetry,
}: PaymentReportDataStateProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isLoading = status === "loading";
  const isUnconfigured = status === "unconfigured";
  const StateIcon = isUnconfigured ? InfoOutlined : CloudOffRounded;

  return (
    <>
      <DialogTitle
        component="h1"
        id="payment-report-selection-title"
        ref={titleRef}
        tabIndex={-1}
        sx={{ pr: 7, color: "secondary.main", fontWeight: 700 }}
      >
        Reportar pago
      </DialogTitle>
      <IconButton
        aria-label="Cerrar reporte de pago"
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8 }}
        type="button"
      >
        <CloseRounded />
      </IconButton>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          pb: "calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        <Stack
          aria-busy={isLoading || undefined}
          aria-live="polite"
          role="status"
          spacing={2}
          sx={{ alignItems: "center", py: 3, textAlign: "center" }}
        >
          {isLoading ? (
            <CircularProgress
              aria-hidden="true"
              sx={prefersReducedMotion
                ? {
                    animation: "none",
                    "& .MuiCircularProgress-circle": { animation: "none" },
                  }
                : undefined}
            />
          ) : (
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 64,
                height: 64,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              })}
            >
              <StateIcon sx={{ width: 32, height: 32 }} />
            </Box>
          )}

          <Stack spacing={0.75}>
            <Typography sx={{ color: "secondary.main", fontWeight: 700 }}>
              {isLoading
                ? "Cargando datos de pago"
                : isUnconfigured
                  ? "Datos de pago no disponibles"
                  : "No pudimos cargar los datos de pago"}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {isLoading
                ? "Espera un momento."
                : "Inténtalo nuevamente para continuar con el reporte."}
            </Typography>
          </Stack>

          {!isLoading && (
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
      </DialogContent>
    </>
  );
}
