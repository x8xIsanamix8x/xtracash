"use client";

import { useEffect, useMemo, useState } from "react";
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
  Container,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import { APP_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { getProfilePersonalInfo, ProfileServiceError } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { getNewBusinessHomeData } from "@/features/home/services/newBusinessHome";
import { createNewBusinessHomeViewModel } from "@/features/home/newBusinessViewModel";
import type { HomeDashboardViewModel } from "@/features/home/newBusinessTypes";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";
import { SolarProductArtwork } from "./components/SolarProductArtwork";
import { marketplaceProducts } from "./products";

type AccessState = "checking" | "allowed" | "unavailable";

function CatalogProductCard({ product }: Readonly<{ product: (typeof marketplaceProducts)[number] }>) {
  return (
    <Box
      component={Link}
      href={`/marketplace/${product.id}`}
      aria-label={`Ver ${product.name}, ${product.price}`}
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
        <SolarProductArtwork variant={product.imageVariant} />
        <Box
          component="span"
          sx={{
            position: "absolute",
            left: 10,
            bottom: 10,
            px: 1.1,
            py: 0.35,
            borderRadius: "999px",
            bgcolor: homeVisualTokens.color.orange,
            color: homeVisualTokens.color.black,
            fontSize: "0.72rem",
            fontWeight: 800,
          }}
        >
          -50%
        </Box>
      </Box>
      <Stack spacing={0.25} sx={{ px: 1.25, pt: 1, pb: 1.25 }}>
        <Typography sx={{ color: homeVisualTokens.color.navy, fontSize: "0.95rem", lineHeight: 1.3, fontWeight: 500 }}>
          {product.name}
        </Typography>
        <Typography sx={{ color: "#20202A", fontSize: "1.22rem", fontWeight: 800, lineHeight: 1.25 }}>
          {product.price}
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
  const [balance, setBalance] = useState<HomeDashboardViewModel["balance"] | null>(null);

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
        void getNewBusinessHomeData(controller.signal)
          .then((data) => {
            if (!controller.signal.aborted) {
              setBalance(createNewBusinessHomeViewModel(data).balance);
            }
          })
          .catch(() => {
            // El catálogo sigue disponible si el resumen financiero no responde.
          });
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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-VE");
    if (!query) return marketplaceProducts;
    return marketplaceProducts.filter((product) =>
      `${product.name} ${product.category} UVU Energy`.toLocaleLowerCase("es-VE").includes(query),
    );
  }, [search]);

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
                onChange={(event) => setSearch(event.target.value)}
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
                  {isAvailableVisible ? (balance?.available ?? "Bs. --") : "Bs. ••••••"}
                </Typography>
                <Typography sx={{ mt: 1.6, fontSize: "0.875rem" }}>
                  Línea total {isAvailableVisible ? (balance?.totalCredit ?? "Bs. --") : "Bs. ••••••"}
                </Typography>
              </Box>

              <Box component="section" aria-label="Catálogo de productos">
                {filteredProducts.length > 0 ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
                    {filteredProducts.map((product) => <CatalogProductCard key={product.id} product={product} />)}
                  </Box>
                ) : (
                  <Stack
                    spacing={1}
                    sx={{ minHeight: 190, alignItems: "center", justifyContent: "center", bgcolor: "white", borderRadius: 3, textAlign: "center", px: 3 }}
                  >
                    <Typography sx={{ color: homeVisualTokens.color.navy, fontWeight: 800 }}>No encontramos productos</Typography>
                    <Typography color="text.secondary" variant="body2">Prueba con otro nombre o palabra clave.</Typography>
                  </Stack>
                )}
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
