import {
  AccountBalanceRounded,
  EditRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { APP_BOTTOM_NAVIGATION_HEIGHT } from "@/components/AppBottomNavigation";
import { PrimaryFinancialCard } from "@/components/PrimaryFinancialCard";

import {
  formatBsAmount,
  formatDocument,
  formatPercentage,
  formatPhone,
} from "../format";
import { getPaymentIconLabel } from "../paymentPurpose";
import type {
  Bank,
  FinancingPlan,
  PaymentIconId,
  ResolvedRecipient,
} from "../types";

type ReviewStepProps = Readonly<{
  amountLabel: string;
  availableLabel: string;
  bank: Bank;
  feeLabel: string;
  financing: FinancingPlan;
  iconId: PaymentIconId | null;
  isSubmitting: boolean;
  label: string;
  rateLabel: string;
  recipient: ResolvedRecipient;
  totalLabel: string;
  onBack: () => void;
  onConfirm: () => void;
}>;

type ReviewItemProps = Readonly<{
  label: string;
  value: string;
}>;

function ReviewItem({ label, value }: ReviewItemProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="dt"
        color="text.secondary"
        sx={{ fontSize: 12, lineHeight: 1.35 }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{ m: 0, mt: 0.25, color: "secondary.main", fontWeight: 700 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ReviewRow({ label, value }: ReviewItemProps) {
  return (
    <Stack
      component="div"
      direction="row"
      sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 2 }}
    >
      <Typography component="dt" color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{ m: 0, color: "secondary.main", fontWeight: 700, textAlign: "right" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

const dueDateFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatDueDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? value : dueDateFormatter.format(date);
}

function formatDays(value: number) {
  return `${value} ${value === 1 ? "día" : "días"}`;
}

export function ReviewStep({
  amountLabel,
  availableLabel,
  bank,
  feeLabel,
  financing,
  iconId,
  isSubmitting,
  label,
  rateLabel,
  recipient,
  totalLabel,
  onBack,
  onConfirm,
}: ReviewStepProps) {
  const recipientInitial = recipient.name.trim().charAt(0).toLocaleUpperCase("es");

  return (
    <Box
      aria-busy={isSubmitting}
      sx={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      <Stack sx={{ flex: 1, gap: "2.1875rem" }}>
        <PrimaryFinancialCard labelledBy="mobile-payment-total-title">
          <Stack spacing={0.5} sx={{ alignItems: "flex-start", textAlign: "left" }}>
            <Typography id="mobile-payment-total-title" sx={{ fontWeight: 700 }}>
              Total a pagar
            </Typography>
            <Typography
              sx={{
                fontSize: "clamp(1.875rem, 9vw, 2.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
                overflowWrap: "anywhere",
              }}
            >
              {totalLabel}
            </Typography>
            <Stack
              direction="row"
              sx={{ width: "100%", pt: 0.75, alignItems: "center", justifyContent: "space-between", gap: 2 }}
            >
              <Typography sx={{ color: alpha("#fff", 0.76), fontSize: 12 }}>
                {label}
              </Typography>
              {iconId && (
                <Typography sx={{ color: "#FFD4AA", fontSize: 12, fontWeight: 600 }}>
                  {getPaymentIconLabel(iconId)}
                </Typography>
              )}
            </Stack>
          </Stack>
        </PrimaryFinancialCard>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: "2rem 2rem 0 0",
            bgcolor: "common.white",
            boxShadow: "0 0 1.25rem rgba(2, 0, 77, 0.08)",
          }}
        >
          <Stack spacing={2.5} sx={{ p: 2, pb: 1 }}>
            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}
            >
              <Box>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Revisa los datos
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Confirma que todo esté correcto.
                </Typography>
              </Box>
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

            <Box
              sx={(theme) => ({
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              })}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "common.white",
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  {recipientInitial}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "secondary.main", fontWeight: 700 }}>
                    {recipient.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {bank.code} · {bank.name}
                  </Typography>
                </Box>
              </Stack>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  mt: 1.5,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1.5,
                }}
              >
                <ReviewItem
                  label="Documento"
                  value={formatDocument(recipient.documentType, recipient.documentNumber)}
                />
                <ReviewItem label="Teléfono" value={formatPhone(recipient.phone)} />
              </Box>
            </Box>

            <Divider />

            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <AccountBalanceRounded color="primary" />
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Detalle del pago
                </Typography>
              </Stack>
              <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.25 }}>
                <ReviewRow label="Monto solicitado" value={amountLabel} />
                <ReviewRow label="Comisión" value={feeLabel} />
                <ReviewRow label="Total a pagar" value={totalLabel} />
              </Box>
              {recipient.saveToDirectory && (
                <Typography color="text.secondary" variant="body2">
                  Se guardará en tu directorio como “{recipient.name}” después de una operación exitosa.
                </Typography>
              )}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Box>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ color: "secondary.main", fontWeight: 700 }}
                >
                  Plan de financiamiento
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Resumen de las condiciones de tu pago.
                </Typography>
              </Box>

              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                {[
                  ["Cuotas", String(financing.installmentCount)],
                  ["Plazo", `${financing.paymentEveryDays} días`],
                ].map(([itemLabel, value]) => (
                  <Box
                    key={itemLabel}
                    sx={(theme) => ({
                      minWidth: 0,
                      p: 1.25,
                      borderRadius: 2.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      textAlign: "center",
                    })}
                  >
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                      {itemLabel}
                    </Typography>
                    <Typography sx={{ color: "secondary.main", fontWeight: 800 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2.5,
                  bgcolor: "#FFF3E8",
                  color: "secondary.main",
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  {formatDays(financing.interestFreeDays)} sin comisión por intereses
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 12 }}>
                  Luego de este periodo, se comenzarán a generar los intereses correspondientes.
                </Typography>
              </Box>

              <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.25 }}>
                <ReviewRow label="Deuda financiada" value={formatBsAmount(financing.debtBs)} />
                <ReviewRow label="Plazo total" value={formatDays(financing.totalTermDays)} />
                <ReviewRow label="Interés diario" value={formatPercentage(financing.dailyInterestRate)} />
              </Box>

            </Stack>

            {isSubmitting && (
              <Stack
                aria-live="polite"
                role="status"
                direction="row"
                spacing={1}
                sx={(theme) => ({
                  alignItems: "center",
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                })}
              >
                <CircularProgress aria-hidden="true" size={22} />
                <Typography>Confirmando transferencia…</Typography>
              </Stack>
            )}
          </Stack>

          <Box
            sx={{
              position: { xs: "sticky", md: "static" },
              zIndex: 2,
              bottom: {
                xs: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT}px + env(safe-area-inset-bottom))`,
                md: "auto",
              },
              mt: "auto",
              p: 2,
              pt: 1.5,
              bgcolor: "common.white",
            }}
          >
            <Button
              disabled={isSubmitting}
              fullWidth
              onClick={onConfirm}
              sx={{ borderRadius: 8, minHeight: 48 }}
              type="button"
              variant="contained"
            >
              {isSubmitting ? "Confirmando transferencia…" : "Confirmar Pago Móvil"}
            </Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
