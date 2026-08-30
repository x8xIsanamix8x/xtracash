import type { Ref } from "react";
import {
  AccountBalanceRounded,
  EditRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  formatBank,
  formatDocument,
  formatPhone,
} from "../format";
import type { Bank, ResolvedRecipient } from "../types";

type ReviewStepProps = Readonly<{
  amountLabel: string;
  availableLabel: string;
  bank: Bank;
  feeLabel: string;
  isSubmitting: boolean;
  rateLabel: string;
  recipient: ResolvedRecipient;
  totalLabel: string;
  titleRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
  onConfirm: () => void;
}>;

type ReviewItemProps = Readonly<{
  label: string;
  value: string;
}>;

function ReviewItem({ label, value }: ReviewItemProps) {
  return (
    <Box>
      <Typography component="dt" color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function ReviewStep({
  amountLabel,
  availableLabel,
  bank,
  feeLabel,
  isSubmitting,
  rateLabel,
  recipient,
  totalLabel,
  titleRef,
  onBack,
  onConfirm,
}: ReviewStepProps) {
  return (
    <Box
      aria-busy={isSubmitting}
      component="section"
      aria-labelledby="mobile-payment-review-title"
      sx={{
        minHeight: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={{ xs: 2, sm: 2.5 }}>
        <Stack spacing={1}>
          <Typography color="text.secondary" variant="body2">
            Paso 2 de 2
          </Typography>
          <Typography
            component="h1"
            id="mobile-payment-review-title"
            ref={titleRef}
            tabIndex={-1}
            sx={{
              color: "secondary.main",
              fontSize: { xs: "clamp(1.875rem, 9vw, 2rem)", sm: "2.25rem" },
              fontWeight: 700,
              lineHeight: 1.12,
            }}
          >
            Revisa el pago
          </Typography>
          <Typography color="text.secondary">
            Verifica los datos antes de confirmar.
          </Typography>
        </Stack>

        <Card variant="outlined">
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Destinatario
                </Typography>
                <Button
                  disabled={isSubmitting}
                  onClick={onBack}
                  startIcon={<EditRounded />}
                  type="button"
                  variant="text"
                >
                  Editar
                </Button>
              </Stack>
              <Typography sx={{ fontWeight: 700 }}>
                {recipient.name}
              </Typography>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <ReviewItem label="Banco" value={formatBank(bank)} />
                <ReviewItem
                  label="Teléfono"
                  value={formatPhone(recipient.phone)}
                />
                <ReviewItem
                  label="Documento"
                  value={formatDocument(
                    recipient.documentType,
                    recipient.documentNumber,
                  )}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={(theme) => ({
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          })}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                <AccountBalanceRounded color="primary" />
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Detalle del pago
                </Typography>
              </Stack>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Box
                  sx={(theme) => ({
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  })}
                >
                  <Typography component="dt" color="text.secondary" variant="body2">
                    Monto solicitado
                  </Typography>
                  <Typography
                    component="dd"
                    sx={{ m: 0, color: "secondary.main", fontWeight: 800 }}
                    variant="h5"
                  >
                    {amountLabel}
                  </Typography>
                </Box>
                <ReviewItem label="Comisión" value={feeLabel} />
                <ReviewItem label="Resultado de la operación" value={totalLabel} />
                <ReviewItem
                  label="Disponible actual"
                  value={availableLabel}
                />
                <ReviewItem label="Tasa aplicada" value={rateLabel} />
              </Box>
              {recipient.saveToDirectory && (
                <Typography color="text.secondary" variant="body2">
                  Se guardará en tu directorio como “{recipient.name}”
                  únicamente después de una operación exitosa.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {isSubmitting && (
          <Stack
            aria-live="polite"
            role="status"
            direction="row"
            spacing={1}
            sx={(theme) => ({
              alignItems: "flex-start",
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            })}
          >
            <CircularProgress aria-hidden="true" size={22} />
            <Typography>
              Confirmando transferencia…
            </Typography>
          </Stack>
        )}
      </Stack>

      <Box
        sx={{
          position: { xs: "sticky", md: "static" },
          zIndex: 2,
          bottom: 0,
          mt: "auto",
          pt: 3,
          pb: "calc(12px + env(safe-area-inset-bottom))",
          bgcolor: "background.default",
        }}
      >
        <Button
          disabled={isSubmitting}
          fullWidth
          onClick={onConfirm}
          type="button"
          variant="contained"
        >
          {isSubmitting
            ? "Confirmando transferencia…"
            : "Confirmar Pago Móvil"}
        </Button>
      </Box>
    </Box>
  );
}
