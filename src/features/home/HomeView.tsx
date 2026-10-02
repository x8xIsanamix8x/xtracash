"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container } from "@mui/material";

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

import { NewBusinessHomeDashboard } from "./components/NewBusinessHomeDashboard";
import { newBusinessHomeMocks } from "./data/newBusinessHomeMocks";
import { homeVisualTokens } from "./homeVisualTokens";
import { createNewBusinessHomeViewModel } from "./newBusinessViewModel";
import type { HomeDashboardViewModel } from "./newBusinessTypes";
import { getNewBusinessHomeData } from "./services/newBusinessHome";
import { getTimeGreeting } from "./timeGreeting";
import {
  AccountSummaryServiceError,
  getAccountSummary,
} from "./services/accountSummary";
import type { OnboardingMasterProgress } from "./types";

export function HomeView() {
  const router = useRouter();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [homeViewModel, setHomeViewModel] = useState<HomeDashboardViewModel | null>(null);
  const [greeting, setGreeting] = useState("Buenos días");
  const [masterOnboardingProgress, setMasterOnboardingProgress] = useState<
    OnboardingMasterProgress | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    void getAccountSummary(controller.signal)
      .then((summary) => {
        if (controller.signal.aborted) return;
        if (
          summary.onboardingMaster
          && summary.onboardingMaster.completedPhases <= 2
          && consumeMasterOnboardingPrompt()
        ) {
          setMasterOnboardingProgress(summary.onboardingMaster);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof AccountSummaryServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
        }
      });

    return () => {
      controller.abort();
    };
  }, [router]);

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
    refreshUnreadCount();
    window.addEventListener("focus", refreshUnreadCount);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshUnreadCount);
    };
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
        }
      });
      return () => controller.abort();
    }

    void getNewBusinessHomeData(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setHomeViewModel(createNewBusinessHomeViewModel(data));
      })
      .catch(() => {
        // Keep the static state available while the session/backend is unavailable.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

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
        {homeViewModel && (
          <NewBusinessHomeDashboard
            greeting={greeting}
            onNotifications={() => router.push("/notifications")}
            unreadNotifications={unreadNotifications}
            viewModel={homeViewModel}
          />
        )}
      </Container>

      <AppBottomNavigation activeItem="home" />
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
