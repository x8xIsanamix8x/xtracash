"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
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
import { MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT } from "@/components/AppBottomNavigation";
import {
  useConsumptionDetail,
  useInstallmentsCache,
  usePaymentData,
} from "./InstallmentsProvider";
import { createPaymentChoices, normalizePaymentSelection, paymentSelectionToQuery } from "./paymentOptions";
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
  const instructionHref = choices && selection
    ? `/installments/${encodeURIComponent(consumptionId)}/payment?${paymentSelectionToQuery(selection)}`
    : null;

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
          variant={viewModel && !viewModel.isPaid ? "marketplace" : "standard"}
        />
      );
    }
  }

  return { section, selectFromSchedule, canSelect: Boolean(choices), instructionHref };
}

function MarketplaceDetailActions({
  onAdvance,
  onInstructions,
  disabled,
}: Readonly<{ onAdvance: () => void; onInstructions: () => void; disabled: boolean }>) {
  return <Box sx={{
    position: "fixed",
    zIndex: (theme) => theme.zIndex.appBar + 2,
    left: "50%",
    bottom: `calc(${MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT}px + env(safe-area-inset-bottom) + 8px)`,
    transform: "translateX(-50%)",
    width: "min(calc(100% - 56px), 420px)",
    px: 0,
    pt: 1.5,
    pb: 1.25,
    background: "linear-gradient(180deg, rgba(255,255,255,0), #fff 22%)",
  }}>
    <Stack spacing={0.9}>
      <Button onClick={onAdvance} disabled={disabled} variant="contained" sx={{ minHeight: 54, borderRadius: 99, bgcolor: "#2751E6", fontSize: "1rem", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#2148D2", boxShadow: "none" } }}>Adelantar cuota</Button>
      <Button onClick={onInstructions} disabled={disabled} variant="outlined" sx={{ minHeight: 54, borderRadius: 99, borderColor: "#E3E3E8", bgcolor: "#F8F8FA", color: "#2751E6", fontSize: "1rem", fontWeight: 800, boxShadow: "0 1px 2px rgba(0,0,0,.14)", "&:hover": { borderColor: "#D5D5DC", bgcolor: "#F4F4F7" } }}>Ver instrucciones de pago</Button>
    </Stack>
  </Box>;
}

export function ConsumptionDetailView({ consumptionId, variant = "standard" }: Readonly<{ consumptionId: string; variant?: "standard" | "marketplace" }>) {
  const router = useRouter();
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

    const scheduleAndPayment = <Stack spacing={variant === "marketplace" ? 2 : 2.5}>
      {viewModel.isPaid && <Alert icon={<TaskAltRounded />} severity="success" sx={{ borderRadius: 3 }}>Este consumo está pagado. No tienes cuotas pendientes.</Alert>}
      <InstallmentSchedule
        items={viewModel.schedule}
        variant={variant}
        onSelect={payment.canSelect && !viewModel.hasPaymentInReview ? payment.selectFromSchedule : undefined}
      />
      {payment.section}
    </Stack>;

    if (variant === "marketplace") return scheduleAndPayment;

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
            <ConsumptionSummary header={viewModel.header} variant={variant} />
            {scheduleAndPayment}
          </Stack>
        </CardContent>
      </Card>
    );
  })();

  if (variant === "marketplace") {
    return (
      <InstallmentsScreen variant="marketplace">
        <Stack sx={{ ...panelSlotSx, minHeight: 0 }} spacing={0}>
          <InstallmentsHeader title="Mis Cuotas" variant="marketplace" />
          {viewModel && <Box sx={{ position: "relative", zIndex: 2, mx: 2, mt: 1.1, mb: -5.8 }}><ConsumptionSummary header={viewModel.header} variant="marketplace" /></Box>}
          <Box sx={{
            flex: 1,
            minHeight: 0,
            mt: viewModel ? 0 : 1.5,
            px: 1.5,
            pt: viewModel ? 7 : 2,
            pb: viewModel && !viewModel.isPaid ? "178px" : 2,
            overflowY: "auto",
            borderRadius: "26px 26px 0 0",
            bgcolor: "#FFFFFF",
          }}>
            {content}
          </Box>
        </Stack>
        {viewModel && !viewModel.isPaid && <MarketplaceDetailActions
          onAdvance={payment.selectFromSchedule}
          onInstructions={() => { if (payment.instructionHref) router.push(payment.instructionHref); }}
          disabled={!payment.canSelect || viewModel.hasPaymentInReview}
        />}
      </InstallmentsScreen>
    );
  }

  return (
    <InstallmentsScreen variant={variant}>
      <Stack spacing={2.5} sx={panelSlotSx}>
        <InstallmentsHeader backHref="/home" backLabel="Volver al inicio" title="Mis Cuotas" variant={variant} />
        <Box sx={panelSlotSx}>{content}</Box>
      </Stack>
    </InstallmentsScreen>
  );
}

export function ConsumptionNotFound({ variant = "standard" }: Readonly<{ variant?: "standard" | "marketplace" }>) {
  return (
    <InstallmentsScreen variant={variant}>
      <Stack spacing={2.5}>
        <InstallmentsHeader backHref={variant === "marketplace" ? "/marketplace" : "/home"} backLabel={variant === "marketplace" ? "Volver al catálogo" : "Volver al inicio"} title="Mis Cuotas" variant={variant} />
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
