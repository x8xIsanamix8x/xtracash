import type { Ref } from "react";
import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatPaymentAmount } from "../presentation";
import type { PaymentAmountOption } from "../types";
import { PaymentReportStepLayout } from "./PaymentReportStepLayout";

type PaymentAmountStepProps = Readonly<{
  amount: PaymentAmountOption;
  titleRef: Ref<HTMLHeadingElement>;
  onContinue: () => void;
}>;

export function PaymentAmountStep({
  amount,
  titleRef,
  onContinue,
}: PaymentAmountStepProps) {
  if (amount.amountBs === null) return null;

  return (
    <PaymentReportStepLayout
      actions={(
        <Button fullWidth onClick={onContinue} type="button" variant="contained">
          Continuar
        </Button>
      )}
      title="Monto a pagar"
      titleId="payment-report-amount-title"
      titleRef={titleRef}
    >
      <Card
        variant="outlined"
        sx={(theme) => ({
          borderColor: alpha(theme.palette.primary.main, 0.3),
          bgcolor: alpha(theme.palette.primary.main, 0.07),
          boxShadow: "none",
        })}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 76,
                height: 76,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              })}
            >
              <PaymentsOutlined sx={{ width: 38, height: 38 }} />
            </Box>
            <Box>
              <Typography color="text.secondary" variant="body2">
                {amount.label}
              </Typography>
              <Typography
                sx={{
                  color: "secondary.main",
                  fontWeight: 800,
                  overflowWrap: "anywhere",
                }}
                variant="h3"
              >
                {formatPaymentAmount(amount.amountBs)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </PaymentReportStepLayout>
  );
}
