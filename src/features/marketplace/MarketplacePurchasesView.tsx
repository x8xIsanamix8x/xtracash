"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowBackRounded, ReceiptLongRounded } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Container, Skeleton, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

import { APP_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { ProfileServiceError, getProfilePersonalInfo } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { getPurchases, MarketplaceServiceError } from "./services/marketplace";
import { formatMarketplaceAmount, formatMarketplacePurchaseDate, marketplacePurchaseStageLabel, parseMarketplacePurchaseList } from "./purchaseManagement";
import type { MarketplacePurchase } from "./purchaseManagement";

type LoadState = "checking" | "loading" | "ready" | "error";

function PurchaseCard({ purchase }: Readonly<{ purchase: MarketplacePurchase }>) {
  const productName = purchase.producto?.nombre ?? "Producto de marketplace";
  const total = formatMarketplaceAmount(purchase.precio);
  const date = formatMarketplacePurchaseDate(purchase.creadaEn);

  return (
    <Card component="article" sx={{ overflow: "hidden", border: "1px solid #DADAE4", borderRadius: "18px", boxShadow: "none" }}>
      <CardActionArea component={Link} href={`/marketplace/compras/${encodeURIComponent(purchase.id)}`} aria-label={`Ver compra de ${productName}`}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1.35} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 76, height: 76, flexShrink: 0, overflow: "hidden", borderRadius: "13px", bgcolor: "#E7E7EE" }}>
              <Box sx={{ height: "100%", display: "grid", placeItems: "center", color: "#666" }}><ReceiptLongRounded /></Box>
            </Box>
            <Stack spacing={0.55} sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: homeVisualTokens.color.navy, fontWeight: 800, lineHeight: 1.25, overflowWrap: "anywhere" }}>{productName}</Typography>
              <Chip label={marketplacePurchaseStageLabel(purchase.etapa)} size="small" color={purchase.etapa === "PAGADA" || purchase.etapa === "PAGAR_CUOTAS" ? "success" : purchase.etapa === "VENCIDA" ? "default" : "primary"} sx={{ alignSelf: "flex-start", maxWidth: "100%", fontWeight: 700 }} />
              {total && <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{total}</Typography>}
              {date && <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }}>Creada el {date}</Typography>}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function MarketplacePurchasesView() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("checking");
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getProfilePersonalInfo(controller.signal).then(async ({ email }) => {
      if (controller.signal.aborted) return;
      if (!canAccessMarketplace(email)) { router.replace("/home"); return; }
      setState("loading");
      try {
        const result = await getPurchases(controller.signal);
        if (controller.signal.aborted) return;
        const parsed = parseMarketplacePurchaseList(result.data);
        if (!parsed) throw new Error("invalid_marketplace_purchases");
        setPurchases(parsed);
        setState("ready");
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof MarketplaceServiceError && cause.status === 401) { router.replace(sessionExpiredUrl); return; }
        setError(cause instanceof MarketplaceServiceError && cause.status === 403
          ? "El marketplace no está habilitado para tu empresa."
          : "No pudimos cargar tus compras. Inténtalo nuevamente.");
        setState("error");
      }
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ProfileServiceError && cause.type === "unauthenticated") { router.replace(sessionExpiredUrl); return; }
      setError("No pudimos validar tu acceso al marketplace.");
      setState("error");
    });
    return () => controller.abort();
  }, [retry, router]);

  const retryLoading = () => {
    setError(null);
    setState("checking");
    setRetry((value) => value + 1);
  };

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: homeVisualTokens.color.surfaceTint, pt: "calc(10px + env(safe-area-inset-top))", pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 24}px + env(safe-area-inset-bottom))` }}>
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}>
            <Button component={Link} href="/marketplace" startIcon={<ArrowBackRounded />} sx={{ minWidth: 42, px: 0.5, color: homeVisualTokens.color.navy }}>Catálogo</Button>
            <Typography component="h1" sx={{ color: homeVisualTokens.color.navy, fontSize: "1.05rem", fontWeight: 800 }}>Mis compras</Typography>
            <Box sx={{ width: 60 }} aria-hidden="true" />
          </Stack>
          <Typography color="text.secondary">Consulta el estado y los detalles de tus compras de Impulsa Place.</Typography>

          {state === "checking" || state === "loading" ? <Stack spacing={1.25} role="status" aria-label="Cargando tus compras"><Skeleton variant="rounded" height={104} /><Skeleton variant="rounded" height={104} /></Stack> : null}
          {state === "error" && <Alert severity="error" action={<Button color="inherit" size="small" onClick={retryLoading}>Reintentar</Button>}>{error}</Alert>}
          {state === "ready" && purchases.length === 0 && <Stack spacing={1.2} sx={{ minHeight: 260, alignItems: "center", justifyContent: "center", p: 3, border: "1px solid #DADAE4", borderRadius: "18px", bgcolor: "white", textAlign: "center" }}>
            <ReceiptLongRounded sx={{ color: homeVisualTokens.color.violet, fontSize: 42 }} />
            <Typography component="h2" sx={{ color: homeVisualTokens.color.navy, fontWeight: 800 }}>Aún no tienes compras</Typography>
            <Typography color="text.secondary">Cuando inicies una compra, podrás consultar aquí su estado y detalles.</Typography>
            <Button component={Link} href="/marketplace" variant="contained" sx={{ mt: 0.5, bgcolor: homeVisualTokens.color.violet, fontWeight: 800 }}>Explorar productos</Button>
          </Stack>}
          {state === "ready" && purchases.length > 0 && <Stack component="section" aria-label="Historial de compras" spacing={1.2}>
            <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>{purchases.length} {purchases.length === 1 ? "compra" : "compras"}</Typography>
            {purchases.map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} />)}
          </Stack>}
        </Stack>
      </Container>
      <AppBottomNavigation activeItem="home" />
    </Box>
  );
}
