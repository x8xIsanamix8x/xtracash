import type { Ref } from "react";
import { PhoneAndroidRounded } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatPaymentAmount } from "../presentation";
import { PaymentReportStepLayout } from "./PaymentReportStepLayout";

type PaymentMethodStepProps = Readonly<{
  amountBs: string;
  titleRef: Ref<HTMLHeadingElement>;
  onSelect: () => void;
}>;

export function PaymentMethodStep({
  amountBs,
  titleRef,
  onSelect,
}: PaymentMethodStepProps) {
  const amountLabel = formatPaymentAmount(amountBs);

  return (
    <PaymentReportStepLayout
      actions={(
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={(theme) => ({
            p: 2,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
          })}
        >
          <Typography color="text.secondary">Total</Typography>
          <Typography
            sx={{
              color: "secondary.main",
              fontWeight: 800,
              overflowWrap: "anywhere",
            }}
          >
            {amountLabel}
          </Typography>
        </Stack>
      )}
      description="Selecciona tu método de pago"
      title="Método de pago"
      titleId="payment-report-method-title"
      titleRef={titleRef}
    >
      <Stack spacing={2.5}>
        <Card
          variant="outlined"
          sx={{
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: "none",
          }}
        >
          <CardActionArea
            aria-label={`Continuar con Pago Móvil por ${amountLabel}`}
            onClick={onSelect}
            sx={{ minHeight: 88 }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                useFlexGap
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Box
                  aria-hidden="true"
                  sx={(theme) => ({
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    color: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  })}
                >
                  <PhoneAndroidRounded />
                </Box>
                <Typography sx={{ minWidth: 0, flex: 1, fontWeight: 700 }}>
                  Pago Móvil
                </Typography>
                <Typography
                  sx={{
                    color: "secondary.main",
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  {amountLabel}
                </Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
    </PaymentReportStepLayout>
  );
}
