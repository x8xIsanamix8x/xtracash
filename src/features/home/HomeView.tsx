"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, Skeleton, Stack, Typography } from "@mui/material";

import {
  APP_BOTTOM_NAVIGATION_HEIGHT,
  AppBottomNavigation,
} from "@/components/AppBottomNavigation";
import {
  MasterOnboardingPrompt,
  consumeMasterOnboardingPrompt,
} from "@/features/master-onboarding";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { getUnreadCount, NotificationsServiceError } from "@/features/notifications/services/notifications";
import { syncPushSubscription } from "@/features/notifications/push/pushNotifications";
import { getProfilePersonalInfo, ProfileServiceError } from "@/features/profile/services/profile";
import { PushNotificationsGuide } from "@/features/notifications/push/PushNotificationsGuide";
import { PwaInstallGuide } from "@/features/pwa/PwaInstallGuide";

import { NewBusinessHomeDashboard } from "./components/NewBusinessHomeDashboard";
import { newBusinessHomeMocks } from "./data/newBusinessHomeMocks";
import { homeVisualTokens } from "./homeVisualTokens";
import { createNewBusinessHomeViewModel } from "./newBusinessViewModel";
import type { HomeDashboardViewModel } from "./newBusinessTypes";
import { getNewBusinessHomeData, NewBusinessHomeError } from "./services/newBusinessHome";
import { getTimeGreeting } from "./timeGreeting";
import { canAccessMarketplace } from "./marketplaceAccess";
import type { OnboardingMasterProgress } from "./types";

export function HomeView() {
  const router = useRouter();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showMarketplacePromo, setShowMarketplacePromo] = useState(false);
  const [homeViewModel, setHomeViewModel] = useState<HomeDashboardViewModel | null>(null);
  const [summaryState, setSummaryState] = useState<"loading" | "ready" | "error">("loading");
  const [summaryRetry, setSummaryRetry] = useState(0);
  const [greeting, setGreeting] = useState("Buenos días");
  const [isSummaryLoaded, setIsSummaryLoaded] = useState(false);
  const [isPushGuideFinished, setIsPushGuideFinished] = useState(false);
  const finishPushGuide = useCallback(() => setIsPushGuideFinished(true), []);
  const [masterOnboardingProgress, setMasterOnboardingProgress] = useState<
    OnboardingMasterProgress | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    const refreshUnreadCount = () => {
      void getUnreadCount(controller.signal)
        .then((count) => {
          if (!controller.signal.aborted) setUnreadNotifications(count);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof NotificationsServiceError && error.type === "unauthenticated") {
            router.replace(sessionExpiredUrl);
          }
        });
    };
    // IMOV-442: un push que llega con la app abierta (el service worker avisa) y la vuelta de la app a
    // primer plano también actualizan la campana.
    const handleWorkerMessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === "INBOX_UPDATED") refreshUnreadCount();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshUnreadCount();
    };
    refreshUnreadCount();
    void syncPushSubscription();
    window.addEventListener("focus", refreshUnreadCount);
    document.addEventListener("visibilitychange", handleVisibility);
    navigator.serviceWorker?.addEventListener("message", handleWorkerMessage);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshUnreadCount);
      document.removeEventListener("visibilitychange", handleVisibility);
      navigator.serviceWorker?.removeEventListener("message", handleWorkerMessage);
    };
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    void getProfilePersonalInfo(controller.signal)
      .then(({ email }) => {
        if (!controller.signal.aborted) setShowMarketplacePromo(canAccessMarketplace(email));
      })
      .catch((error: unknown) => {
        if (
          !controller.signal.aborted
          && error instanceof ProfileServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
        }
      });

    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    const scenario = new URLSearchParams(window.location.search).get("scenario");
    const mockScenario = scenario && scenario in newBusinessHomeMocks
      ? scenario as keyof typeof newBusinessHomeMocks
      : null;

    if (process.env.NODE_ENV !== "production" && mockScenario) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          setHomeViewModel(
            createNewBusinessHomeViewModel(newBusinessHomeMocks[mockScenario]),
          );
          setSummaryState("ready");
          setIsSummaryLoaded(true);
        }
      });
      return () => controller.abort();
    }

    void getNewBusinessHomeData(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setHomeViewModel(createNewBusinessHomeViewModel(data));
        setSummaryState("ready");
        setIsSummaryLoaded(true);
        if (
          data.onboardingMaster
          && data.onboardingMaster.completedPhases <= 2
          && consumeMasterOnboardingPrompt()
        ) {
          setMasterOnboardingProgress(data.onboardingMaster);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof NewBusinessHomeError && error.type === "unauthenticated") {
          router.replace(sessionExpiredUrl);
          return;
        }
        setSummaryState("error");
      });
    return () => controller.abort();
  }, [summaryRetry, router]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const canShowGuides = isSummaryLoaded && homeViewModel !== null && masterOnboardingProgress === null;

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: homeVisualTokens.color.surfaceTint,
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: `calc(${APP_BOTTOM_NAVIGATION_HEIGHT + 40}px + env(safe-area-inset-bottom))`,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        {!homeViewModel && summaryState === "loading" && (
          <Stack spacing={2} role="status" aria-label="Cargando tu información">
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={218} />
            <Skeleton variant="rounded" height={120} />
          </Stack>
        )}
        {!homeViewModel && summaryState === "error" && (
          <Alert
            severity="error"
            action={<Button color="inherit" onClick={() => setSummaryRetry((value) => value + 1)}>Reintentar</Button>}
          >
            No pudimos cargar tu disponible y tus cuotas. Inténtalo de nuevo.
          </Alert>
        )}
        {homeViewModel && summaryState === "loading" && (
          <Typography role="status" sx={{ mb: 1, color: "text.secondary", fontSize: "0.85rem" }}>
            Actualizando tu información…
          </Typography>
        )}
        {homeViewModel && summaryState === "error" && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={<Button color="inherit" onClick={() => setSummaryRetry((value) => value + 1)}>Reintentar</Button>}
          >
            No se pudo actualizar tu información. Mostramos los últimos datos cargados.
          </Alert>
        )}
        {homeViewModel && (
          <NewBusinessHomeDashboard
            greeting={greeting}
            onNotifications={() => router.push("/notifications")}
            unreadNotifications={unreadNotifications}
            showMarketplacePromo={showMarketplacePromo}
            viewModel={homeViewModel}
          />
        )}
      </Container>

      <AppBottomNavigation activeItem="home" />
      <PushNotificationsGuide autoOpen={canShowGuides && !isPushGuideFinished} onFinished={finishPushGuide} />
      <PwaInstallGuide autoOpen={canShowGuides && isPushGuideFinished} />
      {masterOnboardingProgress && (
        <MasterOnboardingPrompt
          onClose={() => setMasterOnboardingProgress(null)}
          open
          progress={masterOnboardingProgress}
        />
      )}
    </Box>
  );
}
