import type { Ref } from "react";
import { CheckCircleOutlineRounded } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatPaymentAmount } from "../presentation";
import { PaymentReportScreenLayout } from "./PaymentReportScreenLayout";

type PaymentReportResultStepProps = Readonly<{
  amountBs: string;
  titleRef: Ref<HTMLHeadingElement>;
  onBackHome: () => void;
}>;

export function PaymentReportResultStep({
  amountBs,
  titleRef,
  onBackHome,
}: PaymentReportResultStepProps) {
  return (
    <PaymentReportScreenLayout
      actions={(
        <Button fullWidth onClick={onBackHome} type="button" variant="contained">
          Volver al inicio
        </Button>
      )}
      labelledBy="payment-report-result-title"
    >
      <Stack
        aria-live="polite"
        role="status"
        spacing={2}
        sx={{
          minWidth: 0,
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 2, sm: 4 },
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
            color: "success.main",
            bgcolor: alpha(theme.palette.success.main, 0.11),
          })}
        >
          <CheckCircleOutlineRounded sx={{ width: 40, height: 40 }} />
        </Box>
        <Typography
          component="h1"
          id="payment-report-result-title"
          ref={titleRef}
          tabIndex={-1}
          variant="h4"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          Pago reportado
        </Typography>
        <Typography color="text.secondary">
          Recibimos tu reporte. Está pendiente de validación.
        </Typography>
        <Box>
          <Typography color="text.secondary" variant="body2">
            Monto reportado
          </Typography>
          <Typography
            sx={{ color: "secondary.main", fontWeight: 800 }}
            variant="h4"
          >
            {formatPaymentAmount(amountBs)}
          </Typography>
        </Box>
      </Stack>
    </PaymentReportScreenLayout>
  );
}
