import type { Ref } from "react";
import {
  AccountBalanceRounded,
  ArrowBackRounded,
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
} from "../format";
import type { Bank, ResolvedRecipient } from "../types";

type ReviewStepProps = Readonly<{
  amountLabel: string;
  availableLabel: string;
  bank: Bank;
  isSubmitting: boolean;
  recipient: ResolvedRecipient;
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
  isSubmitting,
  recipient,
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
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography color="text.secondary" variant="body2">
            Paso 2 de 2
          </Typography>
          <Typography
            component="h1"
            id="mobile-payment-review-title"
            ref={titleRef}
            tabIndex={-1}
            variant="h4"
            sx={{ color: "secondary.main", fontWeight: 700 }}
          >
            Revisa tu solicitud
          </Typography>
          <Typography color="text.secondary">
            Verifica el destinatario y el monto antes de continuar.
          </Typography>
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography
                component="h2"
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                Destinatario
              </Typography>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                }}
              >
                <ReviewItem label="Nombre" value={recipient.name} />
                <ReviewItem label="Banco" value={formatBank(bank)} />
                <ReviewItem
                  label="Teléfono"
                  value={recipient.phone}
                />
                <ReviewItem
                  label="Nacionalidad"
                  value={recipient.nationality}
                />
                <ReviewItem
                  label="Número de documento"
                  value={recipient.documentNumber}
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
          <CardContent>
            <Stack spacing={2}>
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
                  Solicitud
                </Typography>
              </Stack>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                }}
              >
                <ReviewItem label="Monto a enviar" value={amountLabel} />
                <ReviewItem
                  label="Disponible actual"
                  value={availableLabel}
                />
              </Box>
              {recipient.saveToDirectory && (
                <Typography color="text.secondary" variant="body2">
                  Se guardará en tu directorio como “{recipient.alias}”
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
              Procesando transferencia…
            </Typography>
          </Stack>
        )}
      </Stack>

      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        spacing={1.5}
        sx={{ mt: "auto", pt: 3 }}
      >
        <Button
          disabled={isSubmitting}
          fullWidth
          onClick={onBack}
          startIcon={<ArrowBackRounded />}
          type="button"
          variant="outlined"
        >
          Atrás
        </Button>
        <Button
          disabled={isSubmitting}
          fullWidth
          onClick={onConfirm}
          type="button"
          variant="contained"
        >
          {isSubmitting
            ? "Procesando transferencia…"
            : "Confirmar solicitud"}
        </Button>
      </Stack>
    </Box>
  );
}
