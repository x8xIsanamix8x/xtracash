"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CloseRounded,
  FilterListRounded,
  NotificationsNoneRounded,
  SearchRounded,
  ShoppingBagOutlined,
  SellRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import { MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { ProfileServiceError, getProfilePersonalInfo } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { getPurchases, MarketplaceServiceError } from "./services/marketplace";
import { formatMarketplaceAmount, parseMarketplacePurchaseList } from "./purchaseManagement";
import type { MarketplacePurchase } from "./purchaseManagement";

type LoadState = "checking" | "loading" | "ready" | "error";
type PurchaseFilter = "all" | "PAGAR_INICIAL" | "VALIDANDO_PAGO" | "ESPERANDO_FIRMAS" | "PAGAR_CUOTAS" | "PAGADA" | "VENCIDA" | "RECHAZADA";

const FILTER_OPTIONS: ReadonlyArray<Readonly<{ value: PurchaseFilter; label: string }>> = [
  { value: "all", label: "Todas" },
  { value: "PAGAR_INICIAL", label: "Pago pendiente" },
  { value: "VALIDANDO_PAGO", label: "En revisión" },
  { value: "ESPERANDO_FIRMAS", label: "Firma pendiente" },
  { value: "PAGAR_CUOTAS", label: "Confirmadas" },
  { value: "PAGADA", label: "Pagadas" },
  { value: "VENCIDA", label: "Vencidas" },
  { value: "RECHAZADA", label: "Rechazadas" },
];

function purchaseStatus(purchase: MarketplacePurchase): Readonly<{ label: string; kind: "success" | "error" | "warning" | "info" | "neutral"; filter: PurchaseFilter }> {
  const backendStatus = purchase.estado?.toLocaleUpperCase("es-VE") ?? "";
  if (purchase.motivoRechazo || backendStatus.includes("RECHAZ")) return { label: "Rechazada", kind: "error", filter: "RECHAZADA" };
  switch (purchase.etapa) {
    case "PAGAR_INICIAL": return { label: "Pago pendiente", kind: "info", filter: "PAGAR_INICIAL" };
    case "VALIDANDO_PAGO": return { label: "En revisión", kind: "warning", filter: "VALIDANDO_PAGO" };
    case "ESPERANDO_FIRMAS": return { label: "Firma pendiente", kind: "info", filter: "ESPERANDO_FIRMAS" };
    case "PAGAR_CUOTAS": return { label: "Confirmada", kind: "success", filter: "PAGAR_CUOTAS" };
    case "PAGADA": return { label: "Pagada", kind: "success", filter: "PAGADA" };
    case "VENCIDA": return { label: "Vencida", kind: "neutral", filter: "VENCIDA" };
    default: return { label: "Estado actualizado", kind: "neutral", filter: "all" };
  }
}

function readablePurchaseDay(value: string): Readonly<{ key: string; label: string }> {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { key: value, label: "Fecha no disponible" };
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const label = new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", day: "numeric", month: "long" }).format(date);
  return { key: `${get("year")}-${get("month")}-${get("day")}`, label: label.replace(/^./, (letter) => letter.toLocaleUpperCase("es-VE")) };
}

function PurchaseCard({ purchase }: Readonly<{ purchase: MarketplacePurchase }>) {
  const productName = purchase.producto?.nombre ?? "Producto de Impulsa Place";
  const status = purchaseStatus(purchase);
  const initialBs = formatMarketplaceAmount(purchase.pagoInicial?.bs, "Bs.");
  const amount = initialBs ?? formatMarketplaceAmount(purchase.precio);

  const statusColors = {
    success: { background: "#BFF6E2", color: "#064C3A" },
    error: { background: "#FFD0D0", color: "#FF3434" },
    warning: { background: "#FFF0C2", color: "#805400" },
    info: { background: "#DCE5FF", color: "#1E40AF" },
    neutral: { background: "#E6E6E6", color: "#555" },
  }[status.kind];

  return (
    <Card component="article" sx={{ overflow: "hidden", border: "1px solid #D8D8DF", borderRadius: "19px", boxShadow: "none", bgcolor: "#fff" }}>
      <CardActionArea component={Link} href={`/marketplace/compras/${encodeURIComponent(purchase.id)}`} aria-label={`Ver compra de ${productName}. ${amount ?? "Monto no disponible"}. Estado: ${status.label}`}>
        <CardContent sx={{ p: 1.25, minHeight: 68, "&:last-child": { pb: 1.25 } }}>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", minWidth: 0 }}>
            <SellRounded aria-hidden="true" sx={{ ml: 0.5, flexShrink: 0, color: "#2751E6", fontSize: 24 }} />
            <Stack spacing={0.12} sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: "#111", fontSize: "0.84rem", lineHeight: 1.2, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{productName}</Typography>
              <Typography sx={{ color: "#111", fontSize: "0.91rem", lineHeight: 1.2, fontWeight: 800, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>{amount ?? "Monto no disponible"}</Typography>
            </Stack>
            <Chip label={status.label} size="small" sx={{ flexShrink: 0, height: 23, borderRadius: "6px", px: 0.1, bgcolor: statusColors.background, color: statusColors.color, fontWeight: 700, fontSize: "0.66rem" }} />
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseFilter>("all");
  const [pendingFilter, setPendingFilter] = useState<PurchaseFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const visiblePurchases = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-VE").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return [...purchases]
      .filter((purchase) => statusFilter === "all" || purchaseStatus(purchase).filter === statusFilter)
      .filter((purchase) => !query || [purchase.producto?.nombre, purchase.id].some((value) => value?.toLocaleLowerCase("es-VE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query)))
      .sort((left, right) => Date.parse(right.creadaEn ?? "") - Date.parse(left.creadaEn ?? ""));
  }, [purchases, search, statusFilter]);

  const groups = useMemo(() => {
    const grouped = new Map<string, { label: string; purchases: MarketplacePurchase[] }>();
    visiblePurchases.forEach((purchase) => {
      const dateGroup = purchase.creadaEn ? readablePurchaseDay(purchase.creadaEn) : { key: "unknown", label: "Fecha no disponible" };
      const current = grouped.get(dateGroup.key) ?? { label: dateGroup.label, purchases: [] };
      current.purchases.push(purchase);
      grouped.set(dateGroup.key, current);
    });
    return Array.from(grouped.values());
  }, [visiblePurchases]);

  const retryLoading = () => {
    setError(null);
    setState("checking");
    setRetry((value) => value + 1);
  };

  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "#F0EFFF", pt: { xs: "max(48px, env(safe-area-inset-top))", sm: "calc(16px + env(safe-area-inset-top))" }, pb: `calc(${MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT + 20}px + env(safe-area-inset-bottom))`, position: "relative", overflow: "hidden", "&::before": { content: "\"\"", position: "absolute", inset: "0 0 auto", height: 236, bgcolor: "#07074B", zIndex: 0 } }}>
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, position: "relative", zIndex: 1 }}>
        <Stack spacing={1.6}>
          <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#fff" }}>
                <Image src="/entry/isotipo-impulsa.png" alt="Impulsa" width={18} height={22} style={{ objectFit: "contain" }} />
              </Box>
            </Box>
            <Typography component="h1" sx={{ color: "#fff", fontSize: "1.1rem", fontWeight: 800 }}>Mis compras</Typography>
            <IconButton component={Link} href="/notifications" aria-label="Notificaciones" size="small" sx={{ color: "#fff" }}><NotificationsNoneRounded /></IconButton>
          </Stack>

          <Stack direction="row" spacing={1}>
            <OutlinedInput
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar compra"
              inputProps={{ "aria-label": "Buscar compras por producto" }}
              startAdornment={<InputAdornment position="start"><SearchRounded sx={{ color: "#777", fontSize: 20 }} /></InputAdornment>}
              sx={{ minHeight: 50, borderRadius: "12px", bgcolor: "#fff", fontSize: "0.92rem", "& fieldset": { border: 0 } }}
            />
            <Button onClick={() => { setPendingFilter(statusFilter); setIsFilterOpen(true); }} aria-label="Filtrar compras" variant="outlined" sx={{ minWidth: 58, width: 58, bgcolor: "#fff", color: "#2751E6", border: 0, borderRadius: "12px", "&:hover": { bgcolor: "#fff", border: 0 } }}>
              <FilterListRounded />
            </Button>
          </Stack>

          {state === "checking" || state === "loading" ? <Stack spacing={1.4} role="status" aria-label="Cargando tus compras"><Skeleton variant="rounded" height={72} /><Skeleton variant="rounded" height={72} /></Stack> : null}
          {state === "error" && <Alert severity="error" action={<Button color="inherit" size="small" onClick={retryLoading}>Reintentar</Button>}>{error}</Alert>}

          {state === "ready" && <Box component="section" aria-label="Historial de compras" sx={{ mx: -2, px: 2, pt: 1.6, minHeight: "70vh", bgcolor: "#fff", borderRadius: "20px 20px 0 0" }}>
            {purchases.length === 0 ? <Stack spacing={1.2} sx={{ minHeight: 280, alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
              <ShoppingBagOutlined sx={{ color: "#3155ED", fontSize: 42 }} />
              <Typography component="h2" sx={{ color: homeVisualTokens.color.navy, fontWeight: 800 }}>Aún no tienes compras</Typography>
              <Typography color="text.secondary">Cuando inicies una compra en Impulsa Place, podrás consultar aquí su estado.</Typography>
              <Button component={Link} href="/marketplace" variant="contained" sx={{ mt: 0.5, borderRadius: "99px", bgcolor: "#2751E6", fontWeight: 800 }}>Explorar productos</Button>
            </Stack> : visiblePurchases.length === 0 ? <Stack spacing={1.2} role="status" sx={{ minHeight: 220, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <Typography component="h2" sx={{ color: homeVisualTokens.color.navy, fontWeight: 800 }}>No encontramos compras</Typography>
              <Typography color="text.secondary">Prueba con otro nombre o cambia el filtro de estado.</Typography>
            </Stack> : <Stack spacing={2.2}>
              {groups.map((group) => <Box component="section" key={group.label} aria-label={`Compras del ${group.label}`}>
                <Typography component="h2" sx={{ mb: 1.05, color: "#777", fontSize: "0.82rem", lineHeight: 1.2, fontWeight: 700 }}>{group.label}</Typography>
                <Stack spacing={1.05}>{group.purchases.map((purchase) => <PurchaseCard key={purchase.id} purchase={purchase} />)}</Stack>
              </Box>)}
            </Stack>}
          </Box>}
        </Stack>
      </Container>

      <Dialog open={isFilterOpen} onClose={() => setIsFilterOpen(false)} fullWidth maxWidth="sm" aria-labelledby="marketplace-purchases-filter-title" slotProps={{ container: { sx: { alignItems: { xs: "flex-end", sm: "center" } } }, paper: { sx: { m: { xs: 0, sm: 2 }, width: "100%", borderRadius: { xs: "24px 24px 0 0", sm: 4 }, bgcolor: "#F0EFFF", color: "#101044", maxHeight: "min(86dvh, 720px)" } } }}>
        <DialogTitle id="marketplace-purchases-filter-title" sx={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", pt: 3, px: 3, color: "#111", fontWeight: 700, textAlign: "center" }}>
          <IconButton aria-label="Cerrar filtros" onClick={() => setIsFilterOpen(false)} sx={{ border: "1.5px solid currentColor", width: 36, height: 36 }}><CloseRounded fontSize="small" /></IconButton>
          Filtros
          <Box aria-hidden="true" />
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <FormControl fullWidth>
            <FormLabel sx={{ mb: 0.5, color: "#101044", fontWeight: 800 }}>Estado de la compra</FormLabel>
            <RadioGroup value={pendingFilter} onChange={(event) => setPendingFilter(event.target.value as PurchaseFilter)} aria-label="Estado de la compra">
              {FILTER_OPTIONS.map((option) => <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} sx={{ minHeight: 44, mx: 0, px: 0.5, flexDirection: "row-reverse", justifyContent: "space-between", "&:hover": { bgcolor: "rgba(39,81,230,.05)" } }} />)}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <Divider sx={{ mx: 3, borderColor: "rgba(16,16,68,.25)" }} />
        <DialogActions sx={{ display: "flex", flexDirection: "column", gap: 1, px: 3, pt: 2, pb: "calc(20px + env(safe-area-inset-bottom))", "& > :not(style) ~ :not(style)": { ml: 0 } }}>
          <Button fullWidth variant="contained" onClick={() => { setStatusFilter(pendingFilter); setIsFilterOpen(false); }} sx={{ order: -1, minHeight: 54, borderRadius: "99px", bgcolor: "#2751E6", fontWeight: 800 }}>Aplicar filtros</Button>
          <Button fullWidth variant="outlined" onClick={() => setIsFilterOpen(false)} sx={{ minHeight: 54, borderRadius: "99px", bgcolor: "#fff", borderColor: "transparent", color: "#2751E6", fontWeight: 800 }}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      <AppBottomNavigation activeItem="purchases" variant="marketplace" />
    </Box>
  );
}
