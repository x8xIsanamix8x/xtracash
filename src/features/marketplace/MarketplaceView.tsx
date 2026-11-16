"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AppsRounded,
  BoltRounded,
  CategoryRounded,
  CottageRounded,
  ElectricalServicesRounded,
  ExpandMoreRounded,
  SearchRounded,
  VisibilityOffRounded,
  VisibilityRounded,
  WbSunnyRounded,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
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
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import { MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { getProfilePersonalInfo, ProfileServiceError } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { MarketplaceProductImage } from "./components/MarketplaceProductImage";
import { getCatalog, getCatalogCategories, getMarketplaceLimit, MarketplaceServiceError, type CatalogCategory, type CatalogProduct, type MarketplaceLimit } from "./services/marketplace";

type AccessState = "checking" | "allowed" | "unavailable";
type DisplayCurrency = "usdt" | "bs";
const CATEGORY_ICONS: ReadonlyArray<readonly [string, SvgIconComponent]> = [
  ["elect", ElectricalServicesRounded],
  ["energ", BoltRounded],
  ["solar", WbSunnyRounded],
  ["hogar", CottageRounded],
  ["home", CottageRounded],
];

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

function CategoryIcon({ name }: Readonly<{ name: string }>) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-VE");
  const Icon = normalized === "todos"
    ? AppsRounded
    : CATEGORY_ICONS.find(([key]) => normalized.includes(key))?.[1] ?? CategoryRounded;
  return <Icon aria-hidden="true" sx={{ fontSize: 23 }} />;
}

function CurrencyMark({ currency }: Readonly<{ currency: DisplayCurrency }>) {
  return <Box aria-hidden="true" sx={{ width: 18, height: 18, flexShrink: 0, display: "grid", placeItems: "center", border: "1.4px solid currentColor", borderRadius: "50%", fontSize: currency === "usdt" ? "0.78rem" : "0.55rem", lineHeight: 1, fontWeight: 800, letterSpacing: currency === "bs" ? "-0.04em" : 0 }}>
    {currency === "usdt" ? "₮" : "Bs"}
  </Box>;
}

function getDeliveryLabels(product: CatalogProduct): string[] {
  const raw = product.entrega?.modalidades ?? product.entrega?.modalidad;
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : raw.split(/[,|;/]+/);
  return values.map((part) => part.trim()).filter(Boolean).map((part) => {
    const normalized = part.toLocaleUpperCase("es-VE").replace(/[\s-]+/g, "_");
    if (["RETIRO", "PICKUP", "RECOGER"].includes(normalized)) return "Pickup";
    if (["DOMICILIO", "ENVIO", "DELIVERY"].includes(normalized)) return "Delivery";
    return part.replace(/[_-]+/g, " ").toLocaleLowerCase("es-VE").replace(/^./, (letter) => letter.toLocaleUpperCase("es-VE"));
  });
}

function CatalogProductCard({ product }: Readonly<{ product: CatalogProduct }>) {
  const subtitle = product.descripcionCorta?.trim() || product.descripcion?.trim();
  const deliveryLabels = getDeliveryLabels(product);
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
      <Stack spacing={0.3} sx={{ minWidth: 0, flex: 1, px: 0.25, pt: 1, pb: 0.5 }}>
        <Typography sx={{ color: "#111", fontSize: "0.84rem", lineHeight: 1.2, fontWeight: 750, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflowWrap: "anywhere", minHeight: "2.05em" }}>
          {product.nombre}
        </Typography>
        {subtitle && <Typography sx={{ color: "#33333A", fontSize: "0.73rem", lineHeight: 1.25, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
          {subtitle}
        </Typography>}
        <Typography sx={{ mt: "auto", pt: 0.25, color: "#111", fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>
          {formatMoney(product.precio?.usdt)}
        </Typography>
        {typeof product.stock === "number" && <Typography sx={{ color: "#006341", fontSize: "0.68rem", lineHeight: 1.15, mt: 0.35 }}>
          {product.stock} uds. disponibles
        </Typography>}
        {deliveryLabels.length > 0 && <Stack direction="row" useFlexGap sx={{ mt: 0.5, gap: 0.5, flexWrap: "wrap" }}>
          {deliveryLabels.map((label) => <Box component="span" key={label} sx={{ px: 0.7, py: 0.35, borderRadius: "7px", bgcolor: label === "Pickup" ? "#C5F7E4" : "#D9E2FF", color: "#17245A", fontSize: "0.66rem", fontWeight: 700, lineHeight: 1.1 }}>{label}</Box>)}
        </Stack>}
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
  const currencyLabel = displayCurrency === "usdt" ? "USDT" : "Bs";

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(72px + env(safe-area-inset-top))",
        pb: `calc(${MARKETPLACE_BOTTOM_NAVIGATION_HEIGHT + 20}px + env(safe-area-inset-bottom))`,
        position: "relative",
        overflow: "hidden",
        "&::before": { content: "\"\"", position: "absolute", inset: "0 0 auto", height: "206px", bgcolor: "#07074B", zIndex: 0 },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, position: "relative", zIndex: 1 }}>
        <Stack spacing={2.1}>
          {access === "allowed" && (
            <>
              <OutlinedInput
                fullWidth
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                placeholder="Busca un producto"
                inputProps={{ "aria-label": "Buscar productos" }}
                startAdornment={<InputAdornment position="start"><SearchRounded sx={{ color: "#777" }} /></InputAdornment>}
                sx={{ minHeight: 50, borderRadius: "12px", bgcolor: "#fff", fontSize: "0.93rem", "& fieldset": { border: 0 } }}
              />

              <Box
                component="section"
                aria-label="Disponible de financiamiento"
                sx={{
                  minHeight: 132,
                  mt: "-0.35rem",
                  px: 2.25,
                  py: 1.65,
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,.8)",
                  bgcolor: "#2751E6",
                  color: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", minHeight: 30 }}>
                  <Stack direction="row" spacing={0.7} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.87rem", fontWeight: 700 }}>Mi disponible</Typography>
                  <IconButton
                    aria-label={isAvailableVisible ? "Ocultar disponible" : "Mostrar disponible"}
                    aria-pressed={isAvailableVisible}
                    onClick={() => setIsAvailableVisible((current) => !current)}
                    sx={{ color: "#FFFFFF", mr: -1 }}
                  >
                    {isAvailableVisible ? <VisibilityRounded /> : <VisibilityOffRounded />}
                  </IconButton>
                  </Stack>
                  <Select
                    value={displayCurrency}
                    onChange={(event) => setDisplayCurrency(event.target.value as DisplayCurrency)}
                    IconComponent={ExpandMoreRounded}
                    aria-label="Moneda del disponible"
                    renderValue={(value) => <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", whiteSpace: "nowrap" }}><CurrencyMark currency={value as DisplayCurrency} /><Box component="span">{value === "usdt" ? "USDT" : "Bs"}</Box></Stack>}
                    sx={{ width: 104, height: 30, color: "#fff", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, "& .MuiSelect-select": { py: 0.35, pl: 0.7, pr: "23px !important" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,.7)" }, "& .MuiSvgIcon-root": { color: "white", fontSize: 19 } }}
                    MenuProps={{
                      slotProps: {
                        paper: { sx: { width: 104, minWidth: "104px !important", borderRadius: "8px", py: 0.4, "& .MuiMenuItem-root": { minHeight: 32, px: 1, fontSize: "0.75rem" } } },
                        list: { dense: true },
                      },
                    }}
                  >
                    <MenuItem value="usdt"><Stack direction="row" sx={{ alignItems: "center" }}><CurrencyMark currency="usdt" /><Box component="span" sx={{ ml: 1.25 }}>USDT</Box></Stack></MenuItem>
                    <MenuItem value="bs"><Stack direction="row" sx={{ alignItems: "center" }}><CurrencyMark currency="bs" /><Box component="span" sx={{ ml: 1.25 }}>Bs</Box></Stack></MenuItem>
                  </Select>
                </Stack>
                <Stack
                  direction="row"
                  aria-live="polite"
                  aria-label={`Disponible: ${isAvailableVisible ? `${currencyLabel} ${formatAmount(availableAmount)}` : "monto oculto"}`}
                  sx={{ alignItems: "baseline", gap: 0.65, minWidth: 0, mt: 1.2 }}
                >
                  <Typography component="span" sx={{ minWidth: 0, fontSize: "1.25rem", lineHeight: 1.2, fontWeight: 500, overflowWrap: "anywhere" }}>
                    {isAvailableVisible ? formatAmount(availableAmount) : "••••••"}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: "0.68rem", lineHeight: 1.2 }}>{currencyLabel}</Typography>
                </Stack>
                <Typography sx={{ mt: 0.8, fontSize: "0.83rem" }}>
                  Línea total {isAvailableVisible ? formatAmount(totalAmount) : "••••••"} {currencyLabel}
                </Typography>
              </Box>

              <Box component="nav" aria-label="Categorías de productos" sx={{ mx: -2, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
                <Stack direction="row" spacing={1.2} sx={{ minWidth: "max-content", px: 2, alignItems: "flex-start" }}>
                  {[{ id: "", nombre: "Todos" }, ...categories].map((category) => {
                    const selected = categoryId === category.id;
                    return <Button key={category.id || "all"} onClick={() => { setCategoryId(category.id); setPage(0); }} aria-pressed={selected} sx={{ p: 0, minWidth: 0, width: 78, color: "#111", display: "flex", flexDirection: "column", gap: 0.45, textTransform: "none", "&:hover": { bgcolor: "transparent" } }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: selected ? "#2751E6" : "#fff", color: selected ? "#fff" : "#2751E6", transition: "background-color 140ms ease, color 140ms ease", "&:focus-visible": { outline: "3px solid #101044", outlineOffset: 2 } }}><CategoryIcon name={category.nombre} /></Box>
                      <Typography component="span" sx={{ maxWidth: 78, fontSize: "0.69rem", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{category.nombre}</Typography>
                    </Button>;
                  })}
                </Stack>
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
      <AppBottomNavigation activeItem="home" variant="marketplace" />
    </Box>
  );
}
