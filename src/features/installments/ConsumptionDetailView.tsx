"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CloudOffRounded, ReplayRounded, TaskAltRounded } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Skeleton, Stack } from "@mui/material";
import type { ReactNode } from "react";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

import { ConsumptionSummary } from "./components/ConsumptionSummary";
import { InstallmentSchedule } from "./components/InstallmentSchedule";
import { InstallmentsHeader } from "./components/InstallmentsHeader";
import { InstallmentsScreen, panelSlotSx, panelToBottomSx } from "./components/InstallmentsScreen";
import { PaymentOptions } from "./components/PaymentOptions";
import { pillButton, StateCard } from "./components/StateCard";
import {
  useConsumptionDetail,
  useInstallmentsCache,
  usePaymentData,
} from "./InstallmentsProvider";
import { createPaymentChoices, normalizePaymentSelection } from "./paymentOptions";
import type { PaymentSelection } from "./paymentOptions";
import { createConsumptionDetailViewModel } from "./presentation";
import type { ConsumptionDetailViewModel } from "./presentation";

const reducedMotion = {
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
} as const;

function DetailSkeleton() {
  return (
    <Stack aria-busy="true" aria-label="Cargando el detalle del consumo" role="status" spacing={1.25}>
      <Skeleton animation="wave" height={190} sx={{ borderRadius: 4, ...reducedMotion }} variant="rounded" />
      {[0, 1, 2].map((key) => (
        <Skeleton animation="wave" height={80} key={key} sx={{ borderRadius: 4, ...reducedMotion }} variant="rounded" />
      ))}
    </Stack>
  );
}

function scrollToPaymentOptions() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("payment-options")?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

/** Bloque "¿Quieres adelantar?": cotización a hoy y opción elegida. */
function usePaymentSection(
  consumptionId: string,
  viewModel: ConsumptionDetailViewModel | null,
) {
  const paymentData = usePaymentData(consumptionId);
  const { paymentSelections, setPaymentSelection } = useInstallmentsCache();

  const choices = paymentData.status === "ready"
    ? createPaymentChoices(paymentData.data.quote)
    : null;
  const selection = choices
    ? normalizePaymentSelection(choices, paymentSelections[consumptionId])
    : null;
  const select = (next: PaymentSelection) => setPaymentSelection(consumptionId, next);

  const selectFromSchedule = () => {
    if (!choices) return;
    select(choices.onlyAllPending ? { option: "TODAS" } : { option: "PROXIMA" });
    scrollToPaymentOptions();
  };

  let section: ReactNode = null;
  if (viewModel && !viewModel.isPaid) {
    if (paymentData.status === "loading") {
      section = (
        <Skeleton
          animation="wave"
          aria-label="Calculando cuánto debes pagar"
          height={220}
          role="status"
          sx={{ borderRadius: 4, ...reducedMotion }}
          variant="rounded"
        />
      );
    } else if (paymentData.status === "error") {
      section = (
        <Alert
          action={<Button color="inherit" onClick={paymentData.retry} size="small">Reintentar</Button>}
          severity="error"
          sx={{ borderRadius: 3 }}
        >
          {paymentData.error === "unconfigured"
            ? "Los datos de pago no están disponibles. Contacta a soporte."
            : "No pudimos calcular el monto a pagar."}
        </Alert>
      );
    } else if (choices && selection) {
      section = (
        <PaymentOptions
          choices={choices}
          consumptionId={consumptionId}
          hasPaymentInReview={viewModel.hasPaymentInReview}
          onSelectionChange={select}
          selection={selection}
        />
      );
    }
  }

  return { section, selectFromSchedule, canSelect: Boolean(choices) };
}

export function ConsumptionDetailView({ consumptionId }: Readonly<{ consumptionId: string }>) {
  const detail = useConsumptionDetail(consumptionId);
  const viewModel = detail.status === "ready" ? createConsumptionDetailViewModel(detail.data) : null;
  const payment = usePaymentSection(consumptionId, viewModel);

  if (detail.status === "error" && detail.error === "not_found") notFound();

  const content = (() => {
    if (detail.status === "loading") return <DetailSkeleton />;

    if (detail.status === "error") {
      return (
        <StateCard
          action={(
            <Button onClick={detail.retry} startIcon={<ReplayRounded />} sx={pillButton} variant="contained">
              Reintentar
            </Button>
          )}
          description={detail.error === "network"
            ? "Revisa tu conexión a internet e inténtalo nuevamente."
            : "Ocurrió un problema al consultar este consumo. Inténtalo nuevamente."}
          icon={<CloudOffRounded />}
          title="No pudimos cargar el consumo"
        />
      );
    }

    if (!viewModel) return null;

    return (
      <Card
        sx={{
          ...panelToBottomSx,
          borderRadius: `${homeVisualTokens.radius.card}px`,
          bgcolor: homeVisualTokens.color.white,
          boxShadow: "0 8px 24px rgba(0, 0, 75, 0.08)",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack spacing={2}>
            <ConsumptionSummary header={viewModel.header} />
            {viewModel.isPaid && (
              <Alert icon={<TaskAltRounded />} severity="success" sx={{ borderRadius: 3 }}>
                Este consumo está pagado. No tienes cuotas pendientes.
              </Alert>
            )}
            <InstallmentSchedule
              items={viewModel.schedule}
              onSelect={payment.canSelect && !viewModel.hasPaymentInReview
                ? payment.selectFromSchedule
                : undefined}
            />
            {payment.section}
          </Stack>
        </CardContent>
      </Card>
    );
  })();

  return (
    <InstallmentsScreen>
      <Stack spacing={2.5} sx={panelSlotSx}>
        <InstallmentsHeader backHref="/home" backLabel="Volver al inicio" title="Mis cuotas" />
        <Box sx={panelSlotSx}>{content}</Box>
      </Stack>
    </InstallmentsScreen>
  );
}

export function ConsumptionNotFound() {
  return (
    <InstallmentsScreen>
      <Stack spacing={2.5}>
        <InstallmentsHeader backHref="/home" backLabel="Volver al inicio" title="Mis cuotas" />
        <StateCard
          action={(
            <Button component={Link} href="/installments" sx={pillButton} variant="contained">
              Ver mis cuotas
            </Button>
          )}
          description="Puede que el enlace no sea correcto o que el consumo ya no esté disponible."
          icon={<CloudOffRounded />}
          title="No encontramos este consumo"
        />
      </Stack>
    </InstallmentsScreen>
  );
}
