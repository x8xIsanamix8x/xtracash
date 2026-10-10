"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowBackRounded, StorefrontRounded } from "@mui/icons-material";
import { Alert, Box, Container, IconButton, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

import { APP_BOTTOM_NAVIGATION_HEIGHT, AppBottomNavigation } from "@/components/AppBottomNavigation";
import { getProfilePersonalInfo, ProfileServiceError } from "@/features/profile/services/profile";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { canAccessMarketplace } from "../home/marketplaceAccess";
import { homeVisualTokens } from "../home/homeVisualTokens";

type AccessState = "checking" | "allowed" | "unavailable";

export function MarketplaceView() {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");

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

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(12px + env(safe-area-inset-top))",
        pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 32}px + env(safe-area-inset-bottom))`,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {access !== "checking" && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <IconButton aria-label="Volver al inicio" component={Link} href="/home" sx={{ color: homeVisualTokens.color.navy }}>
                <ArrowBackRounded />
              </IconButton>
              <Typography component="h1" sx={{ color: homeVisualTokens.color.navy, fontSize: "1.375rem", fontWeight: 800 }}>
                Impulsa Place
              </Typography>
            </Stack>
          )}

          {access === "allowed" && (
            <Stack
              component="section"
              aria-labelledby="marketplace-title"
              spacing={2}
              sx={{
                alignItems: "center",
                px: { xs: 2.5, sm: 4 },
                py: { xs: 6, sm: 8 },
                borderRadius: 3,
                bgcolor: homeVisualTokens.color.white,
                textAlign: "center",
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 72,
                  height: 72,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2.5,
                  bgcolor: homeVisualTokens.color.surfaceTint,
                  color: homeVisualTokens.color.violet,
                }}
              >
                <StorefrontRounded sx={{ fontSize: 38 }} />
              </Box>
              <Typography id="marketplace-title" component="h2" sx={{ color: homeVisualTokens.color.navy, fontSize: "1.375rem", fontWeight: 800 }}>
                Estamos preparando Impulsa Place
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
                Muy pronto podrás explorar productos disponibles y conocer sus opciones de financiamiento.
              </Typography>
            </Stack>
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
