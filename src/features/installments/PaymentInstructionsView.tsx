"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckRounded,
  CloudOffRounded,
  ContentCopyRounded,
  InfoOutlined,
  ReplayRounded,
  TaskAltRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import { installmentsPrimary } from "./components/ConsumptionSummary";
import { InstallmentsHeader } from "./components/InstallmentsHeader";
import { InstallmentsScreen } from "./components/InstallmentsScreen";
import { pillButton, StateCard } from "./components/StateCard";
import {
  useConsumptionDetail,
  useInstallmentsCache,
  usePaymentData,
} from "./InstallmentsProvider";
import {
  createCopyAllText,
  createInstructionRows,
  getAvailableMethods,
} from "./paymentInstructions";
import type { InstructionRow, PaymentMethod } from "./paymentInstructions";
import {
  createAmountBreakdown,
  createPaymentChoices,
  getSelectedOption,
  normalizePaymentSelection,
  paymentSelectionToQuery,
} from "./paymentOptions";
import type { PaymentSelection } from "./paymentOptions";

const { color } = homeVisualTokens;
const methodLabels: Readonly<Record<PaymentMethod, string>> = {
  mobile: "Pago móvil",
  transfer: "Transferencia",
};

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const copy = async (key: string, value: string, successMessage: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setMessage(successMessage);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      setMessage("No pudimos copiar el dato. Puedes seleccionarlo y copiarlo manualmente.");
    }
  };

  return { copiedKey, message, clearMessage: () => setMessage(""), copy };
}

/** Filas compactas (etiqueta arriba, valor abajo) para que todo quepa sin scroll. */
function InstructionRows({
  rows,
  copiedKey,
  onCopy,
}: Readonly<{
  rows: readonly InstructionRow[];
  copiedKey: string | null;
  onCopy: (row: InstructionRow) => void;
}>) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        px: 1.5,
        borderRadius: `${homeVisualTokens.radius.inset}px`,
        bgcolor: color.neutralSurface,
      }}
    >
      {rows.map((row, index) => {
        const copied = copiedKey === row.key;
        return (
          <Stack
            direction="row"
            key={row.key}
            spacing={1}
            sx={{
              py: "1px",
              alignItems: "center",
              borderTop: index === 0 ? 0 : `1px solid ${alpha(color.navy, 0.08)}`,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography component="dt" sx={{ color: color.neutral, fontSize: "0.6875rem", lineHeight: 1.3 }}>
                {row.label}
              </Typography>
              <Typography
                component="dd"
                sx={{ m: 0, color: color.navy, fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.35, overflowWrap: "anywhere" }}
              >
                {row.displayValue}
              </Typography>
            </Box>
            <IconButton
              aria-label={copied ? `${row.label} copiado` : `Copiar ${row.label.toLowerCase()}`}
              onClick={() => onCopy(row)}
              size="small"
              sx={{ flexShrink: 0, width: 36, height: 36, color: copied ? color.positive : installmentsPrimary }}
            >
              {copied ? <CheckRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}
            </IconButton>
          </Stack>
        );
      })}
    </Box>
  );
}

function InstructionsSkeleton() {
  return (
    <Stack aria-busy="true" aria-label="Cargando los datos de pago" role="status" spacing={1.5}>
      <Skeleton animation="wave" height={130} sx={{ borderRadius: 4 }} variant="rounded" />
      <Skeleton animation="wave" height={320} sx={{ borderRadius: 4 }} variant="rounded" />
    </Stack>
  );
}

type PaymentInstructionsViewProps = Readonly<{
  consumptionId: string;
  /** Opción de la URL (`?option=&count=`). */
  requestedSelection: PaymentSelection | null;
}>;

export function PaymentInstructionsView({
  consumptionId,
  requestedSelection,
}: PaymentInstructionsViewProps) {
  const detail = useConsumptionDetail(consumptionId);
  const paymentData = usePaymentData(consumptionId);
  const { paymentSelections } = useInstallmentsCache();
  const [method, setMethod] = useState<PaymentMethod>("mobile");
  const { copiedKey, message, clearMessage, copy } = useCopy();
  const detailHref = `/installments/${consumptionId}`;

  if (
    (detail.status === "error" && detail.error === "not_found")
    || (paymentData.status === "error" && paymentData.error === "not_found")
  ) {
    notFound();
  }

  const content = (() => {
    if (detail.status === "loading" || paymentData.status === "loading") {
      return <InstructionsSkeleton />;
    }

    if (detail.status === "error" || paymentData.status === "error") {
      const unconfigured = paymentData.status === "error" && paymentData.error === "unconfigured";
      return (
        <StateCard
          action={unconfigured ? (
            <Button component={Link} href={detailHref} sx={pillButton} variant="contained">
              Volver al detalle
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (detail.status === "error") detail.retry();
                if (paymentData.status === "error") paymentData.retry();
              }}
              startIcon={<ReplayRounded />}
              sx={pillButton}
              variant="contained"
            >
              Reintentar
            </Button>
          )}
          description={unconfigured
            ? "Los datos de pago no están disponibles. Contacta a soporte."
            : "Ocurrió un problema al consultar los datos de pago. Inténtalo nuevamente."}
          icon={<CloudOffRounded />}
          title="No pudimos cargar los datos de pago"
        />
      );
    }

    const { quote, destination } = paymentData.data;
    const choices = createPaymentChoices(quote);
    if (!choices) {
      return (
        <StateCard
          action={(
            <Button component={Link} href="/installments" sx={pillButton} variant="contained">
              Ver mis cuotas
            </Button>
          )}
          description="Este consumo no tiene pagos pendientes."
          icon={<TaskAltRounded />}
          title="Estás al día"
        />
      );
    }

    const selection = normalizePaymentSelection(
      choices,
      requestedSelection ?? paymentSelections[consumptionId],
    );
    const option = getSelectedOption(quote, selection)!;
    const breakdown = createAmountBreakdown(option);
    const methods = getAvailableMethods(destination);
    const activeMethod = methods.includes(method) ? method : "mobile";
    const rows = createInstructionRows(destination, breakdown.totalBs, activeMethod);
    const hasPaymentInReview = detail.data.installments.some((item) => item.status === "EN_REVISION");

    return (
      <Stack spacing={1.25}>
        <Box
          component="section"
          aria-labelledby="payment-amount-title"
          sx={{
            p: 2.5,
            borderRadius: `${homeVisualTokens.radius.card}px`,
            bgcolor: installmentsPrimary,
            color: color.white,
          }}
        >
          <Typography id="payment-amount-title" sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
            Monto a pagar
          </Typography>
          <Typography
            sx={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.15 }}
          >
            {breakdown.total}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: "0.8125rem", opacity: 0.9 }}>
            {detail.data.consumption.label} · {breakdown.description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <InfoOutlined aria-hidden="true" sx={{ mt: 0.25, color: color.violet, fontSize: 20 }} />
          <Typography sx={{ color: color.navy, fontSize: "0.8125rem" }}>
            Si pagas otro día, el monto puede cambiar. Al reportar usa la fecha real de tu pago.
          </Typography>
        </Stack>

        <Card
          component="section"
          aria-label="Datos para pagar"
          sx={{
            borderRadius: `${homeVisualTokens.radius.card}px`,
            bgcolor: color.white,
            boxShadow: `0 8px 24px ${alpha(color.navy, 0.08)}`,
          }}
        >
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 0.5 } }}>
            <Stack spacing={1}>
              {methods.length > 1 && (
                <ToggleButtonGroup
                  aria-label="Forma de pago"
                  exclusive
                  fullWidth
                  onChange={(_, value: PaymentMethod | null) => value && setMethod(value)}
                  size="small"
                  sx={{
                    p: 0.5,
                    borderRadius: 99,
                    bgcolor: color.neutralSurface,
                    "& .MuiToggleButtonGroup-grouped": {
                      minHeight: 36,
                      border: 0,
                      borderRadius: "99px !important",
                      color: color.navy,
                      fontWeight: 700,
                      textTransform: "none",
                    },
                    "& .Mui-selected": {
                      bgcolor: `${installmentsPrimary} !important`,
                      color: `${color.white} !important`,
                    },
                  }}
                  value={activeMethod}
                >
                  {methods.map((item) => (
                    <ToggleButton key={item} value={item}>{methodLabels[item]}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}

              <InstructionRows
                copiedKey={copiedKey}
                onCopy={(row) => void copy(row.key, row.copyValue, `${row.label} copiado`)}
                rows={rows}
              />

              <Button
                onClick={() => void copy("all", createCopyAllText(rows), "Datos copiados")}
                size="small"
                startIcon={copiedKey === "all" ? <CheckRounded /> : <ContentCopyRounded />}
                sx={{ alignSelf: "center", minHeight: 36, borderRadius: 99, color: installmentsPrimary, fontWeight: 700 }}
              >
                Copiar todos los datos
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {hasPaymentInReview ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Ya tienes un pago en validación para este consumo.
          </Alert>
        ) : (
          <Button
            component={Link}
            fullWidth
            href={`/installments/${consumptionId}/report?${paymentSelectionToQuery(selection)}`}
            sx={pillButton}
            variant="contained"
          >
            Ya pagué · Reportar pago
          </Button>
        )}
      </Stack>
    );
  })();

  return (
    <InstallmentsScreen>
      <Stack spacing={2}>
        <InstallmentsHeader backHref={detailHref} backLabel="Volver al detalle" title="Instrucciones de pago" />
        <Box>{content}</Box>
      </Stack>
      <Snackbar
        autoHideDuration={2400}
        message={<Box component="span" role="status">{message}</Box>}
        onClose={clearMessage}
        open={Boolean(message)}
        sx={{ bottom: "calc(88px + env(safe-area-inset-bottom)) !important" }}
      />
    </InstallmentsScreen>
  );
}
