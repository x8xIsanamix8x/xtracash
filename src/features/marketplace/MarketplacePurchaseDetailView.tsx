"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowBackRounded, CheckCircleRounded, ReceiptLongRounded, ShoppingBagRounded } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Skeleton, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

import { APP_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { ProfileServiceError, getProfilePersonalInfo } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { formatMarketplaceAmount, formatMarketplacePurchaseDate, marketplacePurchaseStageLabel, marketplacePurchaseStageMessage, parseMarketplacePurchase } from "./purchaseManagement";
import { getPurchase, MarketplaceServiceError } from "./services/marketplace";
import type { MarketplacePurchase } from "./purchaseManagement";

type DetailState = "checking" | "loading" | "ready" | "error";

function PurchaseValue({ label, value }: Readonly<{ label: string; value: string | null }>) {
  if (!value) return null;
  return <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "baseline", py: 0.9 }}>
    <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>{label}</Typography>
    <Typography sx={{ textAlign: "right", fontSize: "0.92rem", fontWeight: 700, overflowWrap: "anywhere" }}>{value}</Typography>
  </Stack>;
}

function describeDebtState(state: string | undefined): string | null {
  if (!state) return null;
  switch (state.toUpperCase()) {
    case "AL_DIA": return "Al día";
    case "VENCIDA":
    case "EN_MORA":
    case "VENCIDO_CON_MORA": return "Tienes cuotas vencidas";
    case "PENDIENTE": return "Tienes cuotas pendientes";
    case "PAGADA": return "Cuotas pagadas";
    default: return null;
  }
}

function nextAction(purchase: MarketplacePurchase): React.ReactNode {
  if (purchase.etapa === "PAGAR_CUOTAS" && purchase.consumoId) {
    return <Button component={Link} fullWidth href={`/installments/${encodeURIComponent(purchase.consumoId)}`} variant="contained" startIcon={<ReceiptLongRounded />} sx={{ minHeight: 52, borderRadius: "13px", bgcolor: homeVisualTokens.color.violet, fontWeight: 800 }}>Ver mis cuotas</Button>;
  }
  if (purchase.etapa === "PAGADA") {
    return <Button component={Link} fullWidth href="/marketplace" variant="contained" startIcon={<ShoppingBagRounded />} sx={{ minHeight: 52, borderRadius: "13px", bgcolor: homeVisualTokens.color.violet, fontWeight: 800 }}>Volver al catálogo</Button>;
  }
  if (purchase.etapa === "VENCIDA") {
    return <Button component={Link} fullWidth href="/marketplace" variant="contained" startIcon={<ShoppingBagRounded />} sx={{ minHeight: 52, borderRadius: "13px", bgcolor: homeVisualTokens.color.violet, fontWeight: 800 }}>Explorar productos</Button>;
  }
  if (["PAGAR_INICIAL", "VALIDANDO_PAGO", "ESPERANDO_FIRMAS"].includes(purchase.etapa) && purchase.producto?.id) {
    const href = `/marketplace/${encodeURIComponent(purchase.producto.id)}?compraId=${encodeURIComponent(purchase.id)}`;
    const label = purchase.etapa === "PAGAR_INICIAL" ? "Retomar pago inicial" : purchase.etapa === "ESPERANDO_FIRMAS" ? "Continuar con la firma" : "Consultar el pago";
    return <Button component={Link} fullWidth href={href} variant="contained" sx={{ minHeight: 52, borderRadius: "13px", bgcolor: homeVisualTokens.color.violet, fontWeight: 800 }}>{label}</Button>;
  }
  return <Button component={Link} fullWidth href="/marketplace/compras" variant="outlined" sx={{ minHeight: 50, borderRadius: "13px", borderColor: homeVisualTokens.color.violet, color: homeVisualTokens.color.violet, fontWeight: 800 }}>Volver a mis compras</Button>;
}

function PurchaseDetail({ purchase }: Readonly<{ purchase: MarketplacePurchase }>) {
  const stageMessage = marketplacePurchaseStageMessage(purchase.etapa);
  const isConfirmed = purchase.etapa === "PAGAR_CUOTAS" || purchase.etapa === "PAGADA";
  const initialUsdt = formatMarketplaceAmount(purchase.pagoInicial?.usdt);
  const initialBs = formatMarketplaceAmount(purchase.pagoInicial?.bs, "Bs.");
  const upcomingDate = formatMarketplacePurchaseDate(purchase.resumenCuotas?.proximoVencimiento);
  const debtLabel = describeDebtState(purchase.resumenCuotas?.estadoDeuda);

  return <Stack spacing={1.5}>
    <Card component="section" aria-label="Estado de compra" sx={{ border: "1px solid #DADAE4", borderRadius: "18px", boxShadow: "none" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.8 }}>
          {isConfirmed && <CheckCircleRounded aria-hidden="true" sx={{ color: "#04B974" }} />}
          <Chip label={marketplacePurchaseStageLabel(purchase.etapa)} color={purchase.etapa === "PAGADA" || purchase.etapa === "PAGAR_CUOTAS" ? "success" : purchase.etapa === "VENCIDA" ? "default" : "primary"} sx={{ fontWeight: 800 }} />
        </Stack>
        <Typography component="h2" sx={{ color: homeVisualTokens.color.navy, fontSize: "1.18rem", fontWeight: 800, overflowWrap: "anywhere" }}>{purchase.producto?.nombre ?? "Compra de Impulsa Place"}</Typography>
        <Typography sx={{ mt: 0.55, color: "text.secondary", lineHeight: 1.45 }}>{stageMessage}</Typography>
        {purchase.motivoRechazo && <Alert severity="error" sx={{ mt: 1.2 }}>Motivo del rechazo: {purchase.motivoRechazo}</Alert>}
      </CardContent>
    </Card>

    <Card component="section" aria-label="Detalles de la compra" sx={{ border: "1px solid #DADAE4", borderRadius: "18px", boxShadow: "none" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography component="h3" sx={{ mb: 0.5, color: homeVisualTokens.color.navy, fontWeight: 800 }}>Detalles de la compra</Typography>
        <PurchaseValue label="Precio" value={formatMarketplaceAmount(purchase.precio)} />
        <PurchaseValue label="Inicial seleccionada" value={purchase.inicialPorcentaje !== undefined ? `${purchase.inicialPorcentaje}%` : null} />
        <PurchaseValue label="Pago inicial" value={initialUsdt} />
        <PurchaseValue label="Pago inicial en bolívares" value={initialBs} />
        <PurchaseValue label="Monto financiado" value={formatMarketplaceAmount(purchase.aFinanciar)} />
        <PurchaseValue label="Cuotas" value={purchase.cuotas !== undefined && purchase.cuotas > 0 ? String(purchase.cuotas) : null} />
        <PurchaseValue label="Fecha de compra" value={formatMarketplacePurchaseDate(purchase.creadaEn)} />
        <PurchaseValue label="Confirmada el" value={formatMarketplacePurchaseDate(purchase.confirmadaEn)} />
      </CardContent>
    </Card>

    {purchase.etapa === "PAGAR_CUOTAS" && <Card component="section" aria-label="Resumen de cuotas" sx={{ border: "1px solid #DADAE4", borderRadius: "18px", boxShadow: "none" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography component="h3" sx={{ mb: 0.5, color: homeVisualTokens.color.navy, fontWeight: 800 }}>Resumen de cuotas</Typography>
        <PurchaseValue label="Pagadas" value={purchase.resumenCuotas?.pagadas !== undefined ? String(purchase.resumenCuotas.pagadas) : null} />
        <PurchaseValue label="Pendientes" value={purchase.resumenCuotas?.pendientes !== undefined ? String(purchase.resumenCuotas.pendientes) : null} />
        <PurchaseValue label="Vencidas" value={purchase.resumenCuotas?.vencidas !== undefined ? String(purchase.resumenCuotas.vencidas) : null} />
        <PurchaseValue label="Próximo vencimiento" value={upcomingDate} />
        {debtLabel && <Typography sx={{ mt: 0.7, color: debtLabel.includes("vencidas") ? "error.main" : "text.secondary", fontSize: "0.88rem", fontWeight: 700 }}>{debtLabel}</Typography>}
        {!purchase.resumenCuotas && <Typography sx={{ mt: 0.7, color: "text.secondary", fontSize: "0.85rem" }}>El resumen de cuotas aún no está disponible. Puedes consultar el detalle del financiamiento.</Typography>}
      </CardContent>
    </Card>}

    {purchase.etapa === "PAGADA" && <Alert severity="success">Compra pagada; no hay cuotas pendientes asociadas a esta operación.</Alert>}
    {purchase.etapa === "VALIDANDO_PAGO" && <Alert severity="info">El estado proviene del servidor. Puedes volver luego y actualizar esta pantalla; no vuelvas a reportar ni a cobrar el pago.</Alert>}
    {purchase.etapa === "VENCIDA" && <Alert severity="warning">La compra venció. La disponibilidad y el precio podrían haber cambiado; consulta el catálogo para iniciar una nueva compra.</Alert>}
  </Stack>;
}

export function MarketplacePurchaseDetailView({ purchaseId }: Readonly<{ purchaseId: string }>) {
  const router = useRouter();
  const [state, setState] = useState<DetailState>("checking");
  const [purchase, setPurchase] = useState<MarketplacePurchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getProfilePersonalInfo(controller.signal).then(async ({ email }) => {
      if (controller.signal.aborted) return;
      if (!canAccessMarketplace(email)) { router.replace("/home"); return; }
      setState("loading");
      try {
        const response = await getPurchase(purchaseId, controller.signal);
        if (controller.signal.aborted) return;
        const parsed = parseMarketplacePurchase(response.data);
        if (!parsed || parsed.id !== purchaseId) throw new Error("invalid_marketplace_purchase");
        setPurchase(parsed);
        setState("ready");
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof MarketplaceServiceError && cause.status === 401) { router.replace(sessionExpiredUrl); return; }
        setError(cause instanceof MarketplaceServiceError && cause.status === 404
          ? "No encontramos esta compra o ya no está disponible para tu cuenta."
          : "No pudimos cargar el detalle de la compra. Inténtalo nuevamente.");
        setState("error");
      }
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ProfileServiceError && cause.type === "unauthenticated") { router.replace(sessionExpiredUrl); return; }
      setError("No pudimos validar tu acceso al marketplace.");
      setState("error");
    });
    return () => controller.abort();
  }, [purchaseId, retry, router]);

  return <Box component="main" sx={{ minHeight: "100dvh", bgcolor: homeVisualTokens.color.surfaceTint, pt: "calc(10px + env(safe-area-inset-top))", pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 24}px + env(safe-area-inset-bottom))` }}>
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}>
          <Button component={Link} href="/marketplace/compras" startIcon={<ArrowBackRounded />} sx={{ minWidth: 42, px: 0.5, color: homeVisualTokens.color.navy }}>Mis compras</Button>
          <Typography component="h1" sx={{ color: homeVisualTokens.color.navy, fontSize: "1.05rem", fontWeight: 800 }}>Detalle</Typography>
          <Button onClick={() => setRetry((value) => value + 1)} disabled={state === "checking" || state === "loading"} sx={{ minWidth: 56, px: 0.5 }}>Actualizar</Button>
        </Stack>
        {(state === "checking" || state === "loading") && <Stack spacing={1.2} role="status" aria-label="Cargando detalle de compra"><Skeleton variant="rounded" height={150} /><Skeleton variant="rounded" height={230} /></Stack>}
        {state === "error" && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setRetry((value) => value + 1)}>Reintentar</Button>}>{error}</Alert>}
        {state === "ready" && purchase && <>
          <PurchaseDetail purchase={purchase} />
          {nextAction(purchase)}
          {purchase.etapa !== "PAGADA" && <Button component={Link} href="/marketplace/compras" sx={{ minHeight: 44 }}>Volver a mis compras</Button>}
        </>}
      </Stack>
    </Container>
    <AppBottomNavigation activeItem="home" />
  </Box>;
}
