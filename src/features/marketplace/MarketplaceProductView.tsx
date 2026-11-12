"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBackRounded } from "@mui/icons-material";
import { Alert, Box, Button, Container, IconButton, Stack, Typography } from "@mui/material";
import { ProfileServiceError, getProfilePersonalInfo } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { getProduct, MarketplaceServiceError, type CatalogProduct } from "./services/marketplace";
import { PurchasePlanFlow } from "./components/PurchasePlanFlow";
import { MarketplaceProductImage } from "./components/MarketplaceProductImage";

type AccessState = "checking" | "allowed" | "unavailable";
function formatMoney(value: number | string | undefined, currency = "Bs.") {
  if (value === undefined) return "Precio no disponible";
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? `${currency} ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}` : `${currency} ${value}`;
}

function textValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function categoryName(value: CatalogProduct["categoria"]): string | null {
  return typeof value === "string" ? textValue(value) : textValue(value?.nombre);
}

function readableLabel(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function readableDeliveryMode(value: unknown): string | null {
  const raw = textValue(value);
  if (!raw) return null;
  const normalized = raw.trim().toLocaleUpperCase("es-VE").replace(/[\s-]+/g, "_");
  const knownModes: Record<string, string> = { RETIRO: "Retiro", DOMICILIO: "A domicilio", ENVIO: "Envío" };
  return knownModes[normalized] ?? raw.replace(/[_-]+/g, " ").toLocaleLowerCase("es-VE").replace(/^./, (letter) => letter.toLocaleUpperCase("es-VE"));
}

function ProductDataSection({ title, rows }: Readonly<{ title: string; rows: ReadonlyArray<readonly [string, string | null]> }>) {
  const visibleRows = rows.filter((row): row is readonly [string, string] => Boolean(row[1]));
  if (!visibleRows.length) return null;

  return <Box component="section" aria-label={title} sx={{ px: 2.25, py: 2, borderTop: "1px solid #D6D6DF", bgcolor: "white" }}>
    <Typography component="h3" sx={{ mb: 1.25, fontSize: "1.15rem", lineHeight: 1.3, fontWeight: 800 }}>{title}</Typography>
    <Stack spacing={1.15}>
      {visibleRows.map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: 1.5, alignItems: "start" }}>
        <Typography sx={{ fontSize: "0.94rem", lineHeight: 1.4, fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.94rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>{value}</Typography>
      </Box>)}
    </Stack>
  </Box>;
}

function ProductInsightSection({ product }: Readonly<{ product: CatalogProduct }>) {
  const bullets = [
    textValue(product.descripcionCorta) ?? textValue(product.descripcion),
    textValue(product.garantia) ? `Garantía: ${textValue(product.garantia)}.` : null,
  ].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);
  const installTerms = new Set(["luz solar", "sombras", "orientacion", "inclinacion", "inversor", "baterias"]);
  const tags = (product.etiquetas ?? []).filter((tag) => installTerms.has(tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()));
  if (!bullets.length && !tags.length && product.financiable !== true) return null;

  return <>
    {bullets.length > 0 && <Box component="section" aria-label="Lo que debes saber" sx={{ px: 2.25, py: 2, borderTop: "1px solid #D6D6DF", bgcolor: "white" }}>
      <Typography component="h3" sx={{ mb: 1.15, fontSize: "1.15rem", lineHeight: 1.3, fontWeight: 800 }}>Lo que debes saber</Typography>
      {product.financiable === true && <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, mb: 1.2, px: 1.35, py: 0.65, borderRadius: 99, bgcolor: "#DCE5FF", color: "#15378F", fontSize: "0.84rem", fontWeight: 700 }}><Box aria-hidden="true" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "#2CCB68" }} />Financiamiento disponible</Box>}
      <Stack component="ul" spacing={1.05} sx={{ m: 0, pl: 2.6, "& li::marker": { color: "#2751E6" } }}>
        {bullets.map((bullet) => { const separator = bullet.indexOf("."); return <Typography component="li" key={bullet} sx={{ pl: 0.2, fontSize: "0.91rem", lineHeight: 1.5, overflowWrap: "anywhere" }}>{separator > 0 ? <><Box component="span" sx={{ fontWeight: 700 }}>{bullet.slice(0, separator + 1)}</Box>{bullet.slice(separator + 1)}</> : bullet}</Typography>; })}
      </Stack>
    </Box>}
    {tags.length > 0 && <Box component="section" aria-label="Antes de instalar" sx={{ px: 2.25, py: 2, borderTop: "1px solid #D6D6DF", bgcolor: "white" }}>
      <Typography component="h3" sx={{ mb: 1.15, fontSize: "1.15rem", lineHeight: 1.3, fontWeight: 800 }}>Antes de instalar</Typography>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
        {tags.map((tag) => <Box component="span" key={tag} sx={{ px: 1.4, py: 0.65, borderRadius: 99, bgcolor: "#DCE5FF", color: "#15378F", fontSize: "0.84rem", fontWeight: 700 }}>{tag}</Box>)}
      </Stack>
    </Box>}
  </>;
}

export function MarketplaceProductView({ productId, resumePurchaseId }: Readonly<{ productId: string; resumePurchaseId?: string }>) {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getProfilePersonalInfo(controller.signal).then(({ email }) => {
      if (controller.signal.aborted) return;
      if (!canAccessMarketplace(email)) { router.replace("/home"); return; }
      setAccess("allowed");
      void getProduct(productId, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setProduct(data); }).catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof MarketplaceServiceError && e.status === 404 ? "Este producto ya no está disponible." : "No pudimos cargar el producto. Inténtalo nuevamente.");
      });
    }).catch((e: unknown) => {
      if (controller.signal.aborted) return;
      if (e instanceof ProfileServiceError && e.type === "unauthenticated") { router.replace(sessionExpiredUrl); return; }
      setAccess("unavailable");
    });
    return () => controller.abort();
  }, [productId, router]);

  const images = product?.imagenes ?? [];
  const activeImage = images[imageIndex];
  const merchant = textValue(product?.comercio?.nombre) ?? textValue(product?.marca);
  const detailRows: ReadonlyArray<readonly [string, string | null]> = product ? [
    ["Marca", textValue(product.marca)],
    ["Modelo", textValue(product.modelo)],
    ["Código del producto", textValue(product.sku)],
    ["Categoría", categoryName(product.categoria)],
    ["Subcategoría", categoryName(product.subcategoria)],
    ["Condición", textValue(product.condicion)],
    ["Disponibilidad", textValue(product.disponibilidad)],
    ["Unidades disponibles", typeof product.stock === "number" ? String(product.stock) : null],
  ] : [];
  const deliveryRows: ReadonlyArray<readonly [string, string | null]> = product ? [
    ["Entrega", readableDeliveryMode(product.entrega?.modalidad)],
    ["Tiempo estimado", textValue(product.entrega?.tiempo)],
    ["Zona de entrega", textValue(product.entrega?.zona)],
    ["Costo de entrega", textValue(product.entrega?.costoUsdt) ? `${product.entrega?.costoUsdt} USDT` : null],
    ["Garantía", textValue(product.garantia)],
  ] : [];
  const specificationRows: ReadonlyArray<readonly [string, string | null]> = product ? [
    ...Object.entries(product.atributos ?? {}).map(([key, value]) => [readableLabel(key), textValue(value)] as const),
    ...deliveryRows,
  ] : [];
  return <Box component="main" sx={{ minHeight: "100dvh", bgcolor: homeVisualTokens.color.surfaceTint, pt: "calc(10px + env(safe-area-inset-top))", pb: "calc(132px + env(safe-area-inset-bottom))" }}>
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Stack spacing={1.75}>
        <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}><IconButton aria-label="Volver al catálogo" component={Link} href="/marketplace"><ArrowBackRounded /></IconButton><Typography component="h1" sx={{ fontSize: "1rem", fontWeight: 600 }}>Impúlsate</Typography><Box sx={{ width: 40 }} /></Stack>
        {access === "checking" && <Typography role="status">Cargando producto…</Typography>}
        {access === "unavailable" && <Alert severity="warning">No pudimos validar tu acceso al marketplace.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {product && <>
          <Box sx={{ position: "relative", overflow: "hidden", aspectRatio: "1 / 0.82", borderRadius: "14px", bgcolor: "#E7E7EE" }}>
            <MarketplaceProductImage url={activeImage?.url} productId={product.id} alt={product.nombre} />
            {images.length > 1 && <Stack component="nav" aria-label="Galería del producto" direction="row" spacing={0.65} sx={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", alignItems: "center", px: 1.1, py: 0.65, borderRadius: 99, bgcolor: "rgba(55, 52, 43, 0.58)" }}>{images.map((image, i) => <Button key={image.id} onClick={() => setImageIndex(i)} aria-label={`Ver imagen ${i + 1}`} aria-pressed={i === imageIndex} sx={{ minWidth: 9, width: 9, height: 9, p: 0, borderRadius: "50%", bgcolor: i === imageIndex ? "white" : "#171717", "&:hover": { bgcolor: i === imageIndex ? "white" : "#171717" } }} />)}</Stack>}
          </Box>
          <Box sx={{ overflow: "hidden", border: "1px solid #DADAE4", borderRadius: "20px", bgcolor: "white" }}>
            <Box component="section" aria-label="Resumen del producto" sx={{ px: 2.25, pt: 2, pb: 1.8 }}>
              <Typography component="h2" sx={{ fontSize: "1.25rem", lineHeight: 1.3, fontWeight: 500 }}>{product.nombre}</Typography>
              <Typography sx={{ fontSize: "1.55rem", lineHeight: 1.2, fontWeight: 800 }}>{formatMoney(product.precio?.usdt, product.moneda ?? "USDT")}</Typography>
              {merchant && <Typography sx={{ mt: 0.55, color: "#2751E6", fontWeight: 700 }}>{merchant}</Typography>}
              {typeof product.stock === "number" && <Stack direction="row" sx={{ mt: 0.75, justifyContent: "space-between", alignItems: "center", gap: 1 }}><Typography sx={{ color: "text.secondary", fontSize: "0.86rem", fontWeight: 600 }}>Disponibilidad</Typography><Typography sx={{ fontSize: "0.92rem", fontWeight: 700 }}>{product.stock} {product.stock === 1 ? "unidad" : "unidades"}</Typography></Stack>}
            </Box>
            <ProductInsightSection product={product} />
            <ProductDataSection title="Detalles del producto" rows={[...detailRows, ...specificationRows]} />
          </Box>
          <PurchasePlanFlow productId={product.id} productName={product.nombre} productImageUrl={activeImage?.url ?? product.imagenPrincipal} productSubtitle={textValue(product.descripcionCorta) ?? undefined} initialPurchaseId={resumePurchaseId} />
        </>}
      </Stack>
    </Container>
  </Box>;
}
