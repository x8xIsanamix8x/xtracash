import type { Ref } from "react";
import {
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { PaymentReportScreenLayout } from "./PaymentReportScreenLayout";

type PaymentReportSubmittingStepProps = Readonly<{
  titleRef: Ref<HTMLHeadingElement>;
}>;

export function PaymentReportSubmittingStep({
  titleRef,
}: PaymentReportSubmittingStepProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <PaymentReportScreenLayout labelledBy="payment-report-submitting-title">
      <Stack
        aria-busy="true"
        aria-live="polite"
        role="status"
        spacing={2}
        sx={{
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <CircularProgress
          aria-hidden="true"
          sx={prefersReducedMotion
            ? { animation: "none", "& .MuiCircularProgress-circle": { animation: "none" } }
            : undefined}
        />
        <Typography
          component="h1"
          id="payment-report-submitting-title"
          ref={titleRef}
          tabIndex={-1}
          variant="h5"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          Enviando reporte…
        </Typography>
        <Typography color="text.secondary">
          Espera un momento. No cierres esta pantalla.
        </Typography>
      </Stack>
    </PaymentReportScreenLayout>
  );
}
