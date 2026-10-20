"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
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
  TextField,
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

function formatMoney(value: number | string | undefined, currency = "Bs.") {
  if (value === undefined) return "Precio no disponible";
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? `${currency} ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)}` : `${currency} ${value}`;
}

function CatalogProductCard({ product }: Readonly<{ product: CatalogProduct }>) {
  return (
    <Box
      component={Link}
      href={`/marketplace/${product.id}`}
      aria-label={`Ver ${product.nombre}, ${formatMoney(product.precio?.usdt, product.moneda ?? "USDT")}`}
      sx={{
        minWidth: 0,
        overflow: "hidden",
        border: "1px solid #DADAE4",
        borderRadius: "12px",
        bgcolor: homeVisualTokens.color.white,
        color: homeVisualTokens.color.navy,
        textDecoration: "none",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 22px rgba(0, 0, 75, .11)" },
        "&:focus-visible": { outline: `3px solid ${homeVisualTokens.color.violet}`, outlineOffset: 3 },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "1.12 / 1", overflow: "hidden" }}>
        <MarketplaceProductImage url={product.imagenPrincipal} productId={product.id} alt={product.nombre} />
      </Box>
      <Stack spacing={0.25} sx={{ px: 1.25, pt: 1, pb: 1.25 }}>
        <Typography sx={{ color: homeVisualTokens.color.navy, fontSize: "0.95rem", lineHeight: 1.3, fontWeight: 500 }}>
          {product.nombre}
        </Typography>
        <Typography sx={{ color: "#20202A", fontSize: "1.22rem", fontWeight: 800, lineHeight: 1.25 }}>
          {formatMoney(product.precio?.usdt, product.moneda ?? "USDT")}
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
  const availableBs = limit?.disponible?.bs;
  const totalBs = limit?.limite?.bs;

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
              {categories.length > 0 && <TextField select fullWidth label="Categoría" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(0); }} size="small" sx={{ bgcolor: "white", borderRadius: "12px" }}>
                <MenuItem value="">Todas las categorías</MenuItem>
                {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.nombre}</MenuItem>)}
              </TextField>}

              <Box
                component="section"
                aria-label="Disponible de financiamiento"
                sx={{
                  minHeight: 180,
                  px: { xs: 2.5, sm: 3 },
                  py: 2.5,
                  borderRadius: "14px",
                  bgcolor: "#2751E6",
                  color: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.95rem" }}>Disponible</Typography>
                  <IconButton
                    aria-label={isAvailableVisible ? "Ocultar disponible" : "Mostrar disponible"}
                    aria-pressed={isAvailableVisible}
                    onClick={() => setIsAvailableVisible((current) => !current)}
                    sx={{ color: "#FFFFFF", mr: -1 }}
                  >
                    {isAvailableVisible ? <VisibilityRounded /> : <VisibilityOffRounded />}
                  </IconButton>
                </Stack>
                <Typography
                  aria-live="polite"
                  sx={{ fontSize: "clamp(2rem, 9vw, 2.75rem)", lineHeight: 1.15, fontWeight: 400, letterSpacing: "-0.04em" }}
                >
                  {isAvailableVisible ? formatMoney(availableBs) : "Bs. ••••••"}
                </Typography>
                <Typography sx={{ mt: 1.6, fontSize: "0.875rem" }}>
                  Línea total {isAvailableVisible ? formatMoney(totalBs) : "Bs. ••••••"}
                </Typography>
              </Box>

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
