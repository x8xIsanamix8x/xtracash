"use client";

import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import { BubbleField } from "./components/BubbleField";
import { OnboardingView } from "./components/OnboardingView";
import { AccessView } from "./components/AccessView";
import { onboardingSteps } from "./data/onboardingSteps";
import {
  clearOnboardingPreference,
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from "./lib/onboardingPreference";

type EntryScreen = "checking" | "onboarding" | "access";

export function EntryFlow() {
  const [screen, setScreen] = useState<EntryScreen>("checking");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const checkPreference = window.setTimeout(() => {
      setScreen(hasCompletedOnboarding() ? "access" : "onboarding");
    }, 0);

    return () => window.clearTimeout(checkPreference);
  }, []);

  const completeOnboarding = () => {
    markOnboardingCompleted();
    setScreen("access");
  };

  const goNext = () => {
    if (stepIndex === onboardingSteps.length - 1) {
      completeOnboarding();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const repeatOnboarding = () => {
    clearOnboardingPreference();
    setStepIndex(0);
    setScreen("onboarding");
  };

  if (screen === "checking") {
    return (
      <Box
        aria-busy="true"
        component="main"
        sx={{
          position: "relative",
          isolation: "isolate",
          minHeight: "100dvh",
          height: "100dvh",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          pt: "calc(24px + env(safe-area-inset-top))",
          pr: "calc(24px + env(safe-area-inset-right))",
          pb: "calc(24px + env(safe-area-inset-bottom))",
          pl: "calc(24px + env(safe-area-inset-left))",
        }}
      >
        <BubbleField />
        <Stack spacing={1} sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{ color: themeTokens.color.brandLogo, fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            Impúlsate Móvil
          </Typography>
          <Typography color="text.secondary" role="status" variant="body2">
            Preparando tu experiencia…
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (screen === "onboarding") {
    return (
      <OnboardingView
        onBack={() => setStepIndex((current) => Math.max(0, current - 1))}
        onNext={goNext}
        onSkip={completeOnboarding}
        step={onboardingSteps[stepIndex]}
        stepIndex={stepIndex}
        totalSteps={onboardingSteps.length}
      />
    );
  }

  return <AccessView onRepeatOnboarding={repeatOnboarding} />;
}
