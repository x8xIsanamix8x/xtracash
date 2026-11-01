"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ReceiptLongRounded,
  SearchRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import { APP_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { getProfilePersonalInfo, ProfileServiceError } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { MarketplaceProductImage } from "./components/MarketplaceProductImage";
import { getCatalog, getCatalogCategories, getMarketplaceLimit, MarketplaceServiceError, type CatalogCategory, type CatalogProduct, type MarketplaceLimit } from "./services/marketplace";

type AccessState = "checking" | "allowed" | "unavailable";
type DisplayCurrency = "usdt" | "bs";

function formatMoney(value: number | string | undefined, currency = "USDT") {
  if (value === undefined) return "Precio no disponible";
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? `${currency} ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)}` : `${currency} ${value}`;
}

function formatAmount(value: number | string | undefined) {
  if (value === undefined) return "Precio no disponible";
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)
    : String(value);
}

function CatalogProductCard({ product }: Readonly<{ product: CatalogProduct }>) {
  const subtitle = product.descripcionCorta?.trim() || product.descripcion?.trim();
  return (
    <Box
      component={Link}
      href={`/marketplace/${product.id}`}
      aria-label={`Ver ${product.nombre}, ${formatMoney(product.precio?.usdt)}`}
      sx={{
        minWidth: 0,
        overflow: "hidden",
        border: "1px solid #DADAE4",
        borderRadius: "20px",
        bgcolor: homeVisualTokens.color.white,
        color: homeVisualTokens.color.navy,
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        p: 1,
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 22px rgba(0, 0, 75, .11)" },
        "&:focus-visible": { outline: `3px solid ${homeVisualTokens.color.violet}`, outlineOffset: 3 },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "14px", bgcolor: "#E7E7EE" }}>
        <MarketplaceProductImage url={product.imagenPrincipal} productId={product.id} alt={product.nombre} />
      </Box>
      <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1, px: 0.25, pt: 1, pb: 0.5 }}>
        <Typography sx={{ color: homeVisualTokens.color.navy, fontSize: "0.9rem", lineHeight: 1.25, fontWeight: 750, overflowWrap: "anywhere" }}>
          {product.nombre}
        </Typography>
        {subtitle && <Typography sx={{ color: "#33333A", fontSize: "0.8rem", lineHeight: 1.3, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
          {subtitle}
        </Typography>}
        <Typography sx={{ mt: "auto", pt: 0.35, color: "#20202A", fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2, overflowWrap: "anywhere" }}>
          {formatMoney(product.precio?.usdt)}
        </Typography>
      </Stack>
    </Box>
  );
}

export function MarketplaceView() {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [search, setSearch] = useState("");
  const [isAvailableVisible, setIsAvailableVisible] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("usdt");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState<MarketplaceLimit | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogReload, setCatalogReload] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getProfilePersonalInfo(controller.signal)
      .then(({ email }) => {
        if (controller.signal.aborted) return;
        if (!canAccessMarketplace(email)) {
          router.replace("/home");
          return;
        }
        setAccess("allowed");
        void getMarketplaceLimit(controller.signal).then(({ data }) => { if (!controller.signal.aborted) setLimit(data); }).catch(() => undefined);
        void getCatalogCategories(controller.signal).then(({ data }) => { if (!controller.signal.aborted) setCategories(data); }).catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ProfileServiceError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setAccess("unavailable");
      });

    return () => controller.abort();
  }, [router]);
  useEffect(() => {
    if (access !== "allowed") return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setCatalogLoading(true);
      void getCatalog(search, page, controller.signal, categoryId || undefined).then(({ data }) => {
        setCatalog(data.items ?? []); setTotalPages(data.totalPages ?? 0); setCatalogError(null);
      }).catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCatalogError(error instanceof MarketplaceServiceError && error.status === 403 ? "El marketplace no está habilitado para tu cuenta." : "No pudimos cargar el catálogo. Inténtalo nuevamente.");
      }).finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [access, catalogReload, categoryId, page, search]);
  const availableAmount = limit?.disponible?.[displayCurrency];
  const totalAmount = limit?.limite?.[displayCurrency];
  const currencyLabel = displayCurrency === "usdt" ? "USDT" : "Bs.";

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(10px + env(safe-area-inset-top))",
        pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.2}>
          {access !== "checking" && (
            <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "white" }}>
                <Image alt="" aria-hidden="true" src="/entry/isotipo-impulsa.png" width={26} height={32} style={{ objectFit: "contain" }} />
              </Box>
              <Typography component="h1" sx={{ color: "#111111", fontSize: "1rem", fontWeight: 500 }}>
                Impúlsate
              </Typography>
              <Box sx={{ width: 42 }} aria-hidden="true" />
            </Stack>
          )}

          {access === "allowed" && (
            <>
              <Typography component="h2" sx={{ mb: -1.4, color: homeVisualTokens.color.navy, fontSize: "1.05rem", fontWeight: 800 }}>
                Disponible
              </Typography>
              <Box
                component="section"
                aria-label="Disponible de financiamiento"
                sx={{
                  minHeight: 142,
                  px: { xs: 2.5, sm: 3 },
                  py: 1.75,
                  borderRadius: "14px",
                  bgcolor: "#2751E6",
                  color: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", minHeight: 38 }}>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={displayCurrency}
                    onChange={(_, value: DisplayCurrency | null) => value && setDisplayCurrency(value)}
                    aria-label="Moneda del disponible"
                    sx={{ p: 0.25, border: "1px solid rgba(255,255,255,.45)", borderRadius: "999px", bgcolor: "rgba(255,255,255,.12)", "& .MuiToggleButtonGroup-grouped": { minHeight: 30, px: 1.25, border: 0, borderRadius: "999px !important", color: "white", fontSize: "0.75rem", fontWeight: 800, lineHeight: 1, textTransform: "none" }, "& .Mui-selected": { bgcolor: "white !important", color: "#2751E6 !important" } }}
                  >
                    <ToggleButton value="usdt" aria-label="Mostrar en USDT">USDT</ToggleButton>
                    <ToggleButton value="bs" aria-label="Mostrar en bolívares">Bs.</ToggleButton>
                  </ToggleButtonGroup>
                  <IconButton
                    aria-label={isAvailableVisible ? "Ocultar disponible" : "Mostrar disponible"}
                    aria-pressed={isAvailableVisible}
                    onClick={() => setIsAvailableVisible((current) => !current)}
                    sx={{ color: "#FFFFFF", mr: -1 }}
                  >
                    {isAvailableVisible ? <VisibilityRounded /> : <VisibilityOffRounded />}
                  </IconButton>
                </Stack>
                <Stack
                  direction="row"
                  aria-live="polite"
                  aria-label={`Disponible: ${isAvailableVisible ? `${currencyLabel} ${formatAmount(availableAmount)}` : "monto oculto"}`}
                  sx={{ alignItems: "baseline", gap: 0.9, minWidth: 0, mt: 0.75 }}
                >
                  <Typography component="span" sx={{ minWidth: 0, fontSize: "clamp(1.65rem, 7vw, 2.2rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.035em", overflowWrap: "anywhere" }}>
                    {isAvailableVisible ? formatAmount(availableAmount) : "••••••"}
                  </Typography>
                </Stack>
                <Typography sx={{ mt: 1.5, fontSize: "0.875rem" }}>
                  Línea total {currencyLabel} {isAvailableVisible ? formatAmount(totalAmount) : "••••••"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
                {categories.length > 0 ? <Select
                  fullWidth
                  displayEmpty
                  value={categoryId}
                  data-testid="marketplace-category-select"
                  inputProps={{ "aria-label": "Categoría" }}
                  renderValue={(selected) => selected ? categories.find((category) => category.id === selected)?.nombre ?? "Categoría" : "Categoría"}
                  onChange={(event) => { setCategoryId(event.target.value); setPage(0); }}
                  sx={{ minWidth: 0, height: 54, bgcolor: "white", borderRadius: "14px", color: "#667085", "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#DADAE4" } }}
                >
                  <MenuItem value="">Todas las categorías</MenuItem>
                  {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.nombre}</MenuItem>)}
                </Select> : <Button disabled variant="outlined" sx={{ minWidth: 0, height: 54, borderRadius: "14px", borderColor: "#DADAE4", color: "text.secondary", fontWeight: 700 }}>Categoría</Button>}
                <Button component={Link} href="/marketplace/compras" startIcon={<ReceiptLongRounded />} fullWidth variant="outlined" sx={{ minWidth: 0, height: 54, borderRadius: "14px", borderColor: homeVisualTokens.color.violet, color: homeVisualTokens.color.violet, fontWeight: 700, whiteSpace: "nowrap", "& .MuiButton-startIcon": { mr: { xs: 0.5, sm: 1 } } }}>
                  Mis compras
                </Button>
              </Box>

              <OutlinedInput
                fullWidth
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                placeholder="Busca un producto"
                inputProps={{ "aria-label": "Buscar productos" }}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: "#151515" }} />
                  </InputAdornment>
                }
                sx={{
                  minHeight: 54,
                  borderRadius: "14px",
                  bgcolor: homeVisualTokens.color.white,
                  fontSize: "1rem",
                  "& fieldset": { border: 0 },
                }}
              />

              {(limit?.estado === "BLOQUEADA" || limit?.estado === "SUSPENDIDA") && <Alert severity="warning">{limit.estado === "BLOQUEADA" ? "El uso de tu cupo del marketplace está bloqueado." : "El marketplace está suspendido temporalmente."} Puedes consultar el catálogo; el servicio validará si una compra puede continuar.</Alert>}

              <Box component="section" aria-label="Catálogo de productos">
                {catalogError ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setCatalogReload((v) => v + 1)}>Reintentar</Button>}>{catalogError}</Alert> : catalogLoading && catalog.length === 0 ? <Typography role="status" sx={{ py: 5, textAlign: "center" }}>Cargando productos…</Typography> : catalog.length > 0 ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
                    {catalog.map((product) => <CatalogProductCard key={product.id} product={product} />)}
                  </Box>
                ) : (
                  <Stack
                    spacing={1}
                    sx={{ minHeight: 190, alignItems: "center", justifyContent: "center", bgcolor: "white", borderRadius: 3, textAlign: "center", px: 3 }}
                  >
                    <Typography sx={{ color: homeVisualTokens.color.navy, fontWeight: 800 }}>No hay productos para mostrar</Typography>
                    <Typography color="text.secondary" variant="body2">Prueba con otro nombre o palabra clave.</Typography>
                  </Stack>
                )}
                {totalPages > 1 && <Stack direction="row" sx={{ mt: 1.5, justifyContent: "space-between" }}><Button disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button><Typography sx={{ alignSelf: "center" }}>Página {page + 1} de {totalPages}</Typography><Button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button></Stack>}
              </Box>
            </>
          )}

          {access === "unavailable" && (
            <Alert severity="warning">
              No pudimos validar tu acceso a Impulsa Place. Vuelve al inicio e inténtalo nuevamente.
            </Alert>
          )}
        </Stack>
      </Container>
      <AppBottomNavigation activeItem="home" />
    </Box>
  );
}
