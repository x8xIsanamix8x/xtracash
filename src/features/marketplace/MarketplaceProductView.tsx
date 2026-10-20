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

function ProductDataSection({ title, rows }: Readonly<{ title: string; rows: ReadonlyArray<readonly [string, string | null]> }>) {
  const visibleRows = rows.filter((row): row is readonly [string, string] => Boolean(row[1]));
  if (!visibleRows.length) return null;

  return <Box component="section" aria-label={title} sx={{ p: 2.25, border: "1px solid #DADAE4", borderRadius: "20px", bgcolor: "white" }}>
    <Typography component="h3" sx={{ mb: 1.25, fontSize: "1.15rem", lineHeight: 1.3, fontWeight: 800 }}>{title}</Typography>
    <Stack spacing={1.15}>
      {visibleRows.map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: 1.5, alignItems: "start" }}>
        <Typography sx={{ fontSize: "0.94rem", lineHeight: 1.4, fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.94rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>{value}</Typography>
      </Box>)}
    </Stack>
  </Box>;
}

export function MarketplaceProductView({ productId }: Readonly<{ productId: string }>) {
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
  const description = textValue(product?.descripcion) ?? textValue(product?.descripcionCorta);
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
    ["Modalidad de entrega", textValue(product.entrega?.modalidad)],
    ["Tiempo de entrega", textValue(product.entrega?.tiempo)],
    ["Zona de entrega", textValue(product.entrega?.zona)],
    ["Costo de entrega", textValue(product.entrega?.costoUsdt) ? `${product.entrega?.costoUsdt} USDT` : null],
    ["Garantía", textValue(product.garantia)],
  ] : [];
  const specificationRows: ReadonlyArray<readonly [string, string | null]> = product ? [
    ...Object.entries(product.atributos ?? {}).map(([key, value]) => [readableLabel(key), textValue(value)] as const),
    ...deliveryRows,
  ] : [];
  return <Box component="main" sx={{ minHeight: "100dvh", bgcolor: homeVisualTokens.color.surfaceTint, pt: "calc(10px + env(safe-area-inset-top))", pb: "calc(112px + env(safe-area-inset-bottom))" }}>
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}><IconButton aria-label="Volver al catálogo" component={Link} href="/marketplace"><ArrowBackRounded /></IconButton><Typography component="h1" sx={{ fontSize: "1rem", fontWeight: 600 }}>Impúlsate</Typography><Box sx={{ width: 40 }} /></Stack>
        {access === "checking" && <Typography role="status">Cargando producto…</Typography>}
        {access === "unavailable" && <Alert severity="warning">No pudimos validar tu acceso al marketplace.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {product && <>
          <Box sx={{ overflow: "hidden", aspectRatio: "1 / 0.9", borderRadius: "14px", bgcolor: "#E7E7EE" }}>
            <MarketplaceProductImage url={activeImage?.url} productId={product.id} alt={product.nombre} />
          </Box>
          {images.length > 1 && <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>{images.map((image, i) => <Button key={image.id} onClick={() => setImageIndex(i)} aria-label={`Ver imagen ${i + 1}`} aria-pressed={i === imageIndex} sx={{ minWidth: 16, width: 16, height: 16, p: 0, borderRadius: "50%", bgcolor: i === imageIndex ? "#20202A" : "#AAA" }} />)}</Stack>}
          <Box component="section" sx={{ p: 2.25, border: "1px solid #DADAE4", borderRadius: "20px", bgcolor: "white" }}>
            <Typography component="h2" sx={{ fontSize: "1.25rem", lineHeight: 1.3 }}>{product.nombre}</Typography>
            <Typography sx={{ fontSize: "1.55rem", fontWeight: 800 }}>{formatMoney(product.precio?.usdt, product.moneda ?? "USDT")}</Typography>
            {merchant && <Typography sx={{ mt: 0.4, color: "#2751E6", fontWeight: 700 }}>{merchant}</Typography>}
          </Box>
          <ProductDataSection title="Detalles del producto" rows={detailRows} />
          <ProductDataSection title="Especificaciones del producto" rows={specificationRows} />
          {description && <Box component="section" sx={{ p: 2.25, border: "1px solid #DADAE4", borderRadius: "20px", bgcolor: "white" }}>
            <Typography component="h3" sx={{ mb: 1, fontSize: "1.15rem", fontWeight: 800 }}>Descripción</Typography>
            <Typography sx={{ fontSize: "0.94rem", lineHeight: 1.5, whiteSpace: "pre-line" }}>{description}</Typography>
          </Box>}
          <PurchasePlanFlow productId={product.id} productName={product.nombre} productImageUrl={activeImage?.url ?? product.imagenPrincipal} productSubtitle={textValue(product.descripcionCorta) ?? undefined} />
        </>}
      </Stack>
    </Container>
  </Box>;
}
