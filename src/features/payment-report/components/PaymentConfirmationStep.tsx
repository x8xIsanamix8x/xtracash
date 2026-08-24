import type { Ref } from "react";
import { PriceCheckRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { createPaymentDetails } from "../presentation";
import type { PaymentReportDestination } from "../types";
import { PaymentReportScreenLayout } from "./PaymentReportScreenLayout";

type PaymentConfirmationStepProps = Readonly<{
  amountBs: string;
  destination: PaymentReportDestination;
  titleRef: Ref<HTMLHeadingElement>;
  onConfirm: () => void;
  onMistake: () => void;
}>;

export function PaymentConfirmationStep({
  amountBs,
  destination,
  titleRef,
  onConfirm,
  onMistake,
}: PaymentConfirmationStepProps) {
  const details = createPaymentDetails(destination, amountBs);

  return (
    <PaymentReportScreenLayout
      actions={(
        <>
          <Button fullWidth onClick={onConfirm} type="button" variant="contained">
            Sí, continuar
          </Button>
          <Button fullWidth onClick={onMistake} type="button" variant="outlined">
            No, me equivoqué
          </Button>
        </>
      )}
      labelledBy="payment-report-confirmation-title"
    >
      <Stack
        spacing={2.5}
        sx={{
          minWidth: 0,
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 1, sm: 2 },
          textAlign: "center",
        }}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: 72,
            height: 72,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          })}
        >
          <PriceCheckRounded sx={{ width: 38, height: 38 }} />
        </Box>

        <Typography
          component="h1"
          id="payment-report-confirmation-title"
          ref={titleRef}
          tabIndex={-1}
          variant="h4"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          ¿Realizaste el pago?
        </Typography>

        <Card
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 440,
            boxShadow: "none",
            textAlign: "left",
          }}
        >
          <CardContent
            sx={{
              p: { xs: 2, sm: 2.5 },
              "&:last-child": { pb: { xs: 2, sm: 2.5 } },
            }}
          >
            <Stack spacing={1.5}>
              {details.map((detail) => (
                <Stack
                  key={detail.key}
                  direction="row"
                  spacing={2}
                  useFlexGap
                  sx={{
                    minWidth: 0,
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography color="text.secondary" variant="body2">
                    {detail.key === "amount"
                      ? "Monto pagado"
                      : detail.label}
                  </Typography>
                  <Typography
                    sx={{
                      color: "secondary.main",
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                      textAlign: "right",
                    }}
                  >
                    {detail.displayValue}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </PaymentReportScreenLayout>
  );
}
