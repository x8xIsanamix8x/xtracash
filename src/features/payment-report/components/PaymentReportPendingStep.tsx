import type { Ref } from "react";
import { PendingActionsRounded } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  pendingPaymentReportPresentation,
  runPendingPrimaryAction,
} from "../pendingPaymentReport";
import { PaymentReportScreenLayout } from "./PaymentReportScreenLayout";

type PaymentReportPendingStepProps = Readonly<{
  titleRef: Ref<HTMLHeadingElement>;
  onBackHome: () => void;
}>;

export function PaymentReportPendingStep({
  titleRef,
  onBackHome,
}: PaymentReportPendingStepProps) {
  return (
    <PaymentReportScreenLayout
      actions={(
        <Button
          fullWidth
          onClick={() => runPendingPrimaryAction(onBackHome)}
          type="button"
          variant="contained"
        >
          {pendingPaymentReportPresentation.primaryActionLabel}
        </Button>
      )}
      labelledBy="payment-report-pending-title"
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
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          })}
        >
          <PendingActionsRounded sx={{ width: 38, height: 38 }} />
        </Box>
        <Typography
          component="h1"
          id="payment-report-pending-title"
          ref={titleRef}
          tabIndex={-1}
          variant="h4"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          {pendingPaymentReportPresentation.title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          {pendingPaymentReportPresentation.message}
        </Typography>
      </Stack>
    </PaymentReportScreenLayout>
  );
}
