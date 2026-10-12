"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBackRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { ProfileServiceError, getProfilePersonalInfo } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { PurchasePlanFlow } from "./components/PurchasePlanFlow";
import { SolarProductArtwork } from "./components/SolarProductArtwork";
import type { MarketplaceProduct } from "./products";

type AccessState = "checking" | "allowed" | "unavailable";

export function MarketplaceProductView({ product }: Readonly<{ product: MarketplaceProduct | undefined }>) {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [imageIndex, setImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getProfilePersonalInfo(controller.signal)
      .then(({ email }) => {
        if (controller.signal.aborted) return;
        if (canAccessMarketplace(email)) setAccess("allowed");
        else router.replace("/home");
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

  if (!product) {
    return (
      <Box component="main" sx={{ minHeight: "100dvh", bgcolor: homeVisualTokens.color.surfaceTint, pt: "calc(24px + env(safe-area-inset-top))" }}>
        <Container maxWidth="sm">
          <Stack spacing={2}>
            <IconButton aria-label="Volver al catálogo" component={Link} href="/marketplace" sx={{ alignSelf: "flex-start", color: homeVisualTokens.color.navy }}>
              <ArrowBackRounded />
            </IconButton>
            <Alert severity="info">Este producto no está disponible en el catálogo de muestra.</Alert>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(10px + env(safe-area-inset-top))",
        pb: "calc(112px + env(safe-area-inset-bottom))",
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          {access !== "checking" && (
            <Stack component="header" direction="row" sx={{ minHeight: 52, alignItems: "center", justifyContent: "space-between" }}>
              <IconButton aria-label="Volver al catálogo" component={Link} href="/marketplace" sx={{ color: homeVisualTokens.color.navy, ml: -1 }}>
                <ArrowBackRounded />
              </IconButton>
              <Typography component="h1" sx={{ color: "#111111", fontSize: "1rem", fontWeight: 600 }}>
                Impúlsate
              </Typography>
              <Box sx={{ width: 40 }} aria-hidden="true" />
            </Stack>
          )}

          {access === "allowed" && (
            <>
              <Box sx={{ position: "relative", overflow: "hidden", aspectRatio: "1 / 0.9", borderRadius: "14px", bgcolor: "#e5ece8" }}>
                <SolarProductArtwork variant={(product.imageVariant + imageIndex) % 4} />
                <IconButton
                  aria-label="Imagen anterior"
                  onClick={() => setImageIndex((current) => (current + 2) % 3)}
                  sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,.8)", color: homeVisualTokens.color.navy, "&:hover": { bgcolor: "white" } }}
                >
                  <ChevronLeftRounded />
                </IconButton>
                <IconButton
                  aria-label="Imagen siguiente"
                  onClick={() => setImageIndex((current) => (current + 1) % 3)}
                  sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,.8)", color: homeVisualTokens.color.navy, "&:hover": { bgcolor: "white" } }}
                >
                  <ChevronRightRounded />
                </IconButton>
                <Stack direction="row" spacing={0.75} sx={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", alignItems: "center", borderRadius: 99, px: 1, py: 0.5, bgcolor: "rgba(0,0,0,.45)" }}>
                  {[0, 1, 2].map((index) => (
                    <Box key={index} component="button" type="button" aria-label={`Ver imagen ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)} sx={{ width: 8, height: 8, p: 0, border: 0, borderRadius: "50%", bgcolor: imageIndex === index ? "white" : "rgba(0,0,0,.8)", cursor: "pointer" }} />
                  ))}
                </Stack>
              </Box>

              <Box component="section" sx={{ p: 2.25, border: "1px solid #DADAE4", borderRadius: "14px", bgcolor: "white" }}>
                <Stack spacing={0.5}>
                  <Typography component="h2" sx={{ color: "#151515", fontSize: "1.25rem", lineHeight: 1.3 }}>{product.name}</Typography>
                  <Typography sx={{ color: "#171717", fontSize: "1.65rem", fontWeight: 800, lineHeight: 1.2 }}>{product.price}</Typography>
                  <Typography sx={{ color: "#171717", fontWeight: 700 }}>UVU Energy</Typography>
                </Stack>
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ mb: 0.75, color: "#171717", fontWeight: 700 }}>Descripción</Typography>
                  <Typography sx={{ color: "#252525", fontSize: "0.94rem", lineHeight: 1.45, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: showFullDescription ? "unset" : 4, overflow: "hidden" }}>
                    {product.description}
                  </Typography>
                  <Button onClick={() => setShowFullDescription((current) => !current)} size="small" sx={{ minWidth: 0, px: 0, mt: 0.5, textDecoration: "underline", textUnderlineOffset: 2 }}>
                    {showFullDescription ? "Ver menos" : "Ver más detalles"}
                  </Button>
                </Box>
              </Box>

              <PurchasePlanFlow
                productName={product.id === "kit-solar-3kw" ? "Equipo UVU de 3 KW" : product.name}
                imageVariant={product.imageVariant}
              />
            </>
          )}

          {access === "unavailable" && <Alert severity="warning">No pudimos validar tu acceso a Impulsa Place. Vuelve al inicio e inténtalo nuevamente.</Alert>}
        </Stack>
      </Container>
    </Box>
  );
}
