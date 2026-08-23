import type { Ref } from "react";
import { CloseRounded, InfoOutlined } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatPaymentAmount } from "../presentation";
import type { PaymentAmountOption } from "../types";

type PaymentAmountSelectionProps = Readonly<{
  options: readonly PaymentAmountOption[];
  titleRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
  onSelect: (option: PaymentAmountOption) => void;
}>;

export function PaymentAmountSelection({
  options,
  titleRef,
  onClose,
  onSelect,
}: PaymentAmountSelectionProps) {
  const hasAvailableAmount = options.some((option) => option.amountBs !== null);

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
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Selecciona cómo quieres pagar tu crédito.
          </Typography>

          <Stack spacing={1.5}>
            {options.map((option) => (
              <Card
                key={option.kind}
                variant="outlined"
                sx={(theme) => ({
                  borderColor: option.amountBs
                    ? alpha(theme.palette.primary.main, 0.28)
                    : alpha(theme.palette.text.primary, 0.12),
                  boxShadow: "none",
                })}
              >
                <CardActionArea
                  aria-label={option.amountBs
                    ? `${option.label}, ${formatPaymentAmount(option.amountBs)}`
                    : `${option.label}, no disponible`}
                  disabled={option.amountBs === null}
                  onClick={() => onSelect(option)}
                  sx={{ minHeight: 76 }}
                >
                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      useFlexGap
                      sx={{
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {option.label}
                      </Typography>
                      <Typography
                        color={option.amountBs ? "secondary.main" : "text.secondary"}
                        sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                      >
                        {option.amountBs
                          ? formatPaymentAmount(option.amountBs)
                          : "No disponible"}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>

          {!hasAvailableAmount && (
            <Stack
              aria-live="polite"
              role="status"
              direction="row"
              spacing={1.25}
              sx={(theme) => ({
                alignItems: "flex-start",
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              })}
            >
              <InfoOutlined aria-hidden="true" color="primary" />
              <Box>
                <Typography sx={{ color: "secondary.main", fontWeight: 700 }}>
                  No hay montos disponibles
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Por ahora no podemos iniciar un reporte de pago. Consulta nuevamente más tarde.
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </>
  );
}
