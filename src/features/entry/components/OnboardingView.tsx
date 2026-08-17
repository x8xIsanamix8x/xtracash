"use client";

import { useEffect, useRef } from "react";
import { ArrowBackRounded } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";

import type { OnboardingStep } from "../data/onboardingSteps";
import { BubbleField } from "./BubbleField";
import { OnboardingVisual } from "./OnboardingVisual";

type OnboardingViewProps = Readonly<{
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}>;

export function OnboardingView({
  step,
  stepIndex,
  totalSteps,
  onBack,
  onNext,
  onSkip,
}: OnboardingViewProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousStepIndexRef = useRef(stepIndex);
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    if (previousStepIndexRef.current !== stepIndex) {
      titleRef.current?.focus();
      previousStepIndexRef.current = stepIndex;
    }
  }, [stepIndex]);

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        isolation: "isolate",
        minHeight: "100dvh",
        height: "100dvh",
        display: "grid",
        gridTemplateRows: "48px minmax(0, 1fr) auto",
        overflow: "hidden",
        pt: "calc(16px + env(safe-area-inset-top))",
        pr: "calc(24px + env(safe-area-inset-right))",
        pb: "calc(12px + env(safe-area-inset-bottom))",
        pl: "calc(24px + env(safe-area-inset-left))",
      }}
    >
      <BubbleField />

      <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 720, mx: "auto" }}>
        {stepIndex > 0 && (
          <IconButton aria-label="Volver al paso anterior" color="secondary" onClick={onBack}>
            <ArrowBackRounded />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "minmax(96px, 1fr) auto",
          overflowY: "auto",
          py: 1,
        }}
      >
        <Box
          sx={{
            minHeight: 0,
            display: "grid",
            placeItems: "center",
            transform: "translateY(-3%)",
          }}
        >
          <OnboardingVisual imageAlt={step.imageAlt} visualKey={step.visualKey} />
        </Box>

        <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 560, mx: "auto", textAlign: "center" }}>
          <Typography
            component="h1"
            ref={titleRef}
            tabIndex={-1}
            variant="h3"
            sx={{
              "&:focus-visible": {
                outline: "3px solid",
                outlineColor: "primary.main",
                outlineOffset: 6,
              },
            }}
          >
            {step.title}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.125rem" }}>
            {step.description}
          </Typography>
        </Stack>
      </Box>

      <Stack
        spacing={1}
        sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, mx: "auto", pt: 2 }}
      >
        <Box
          aria-label={`Paso ${stepIndex + 1} de ${totalSteps}`}
          role="img"
          sx={{ display: "flex", minHeight: 20, alignItems: "center", justifyContent: "center", gap: 1 }}
        >
          {Array.from({ length: totalSteps }, (_, index) => {
            const isActive = index === stepIndex;

            return (
              <Box
                aria-hidden="true"
                key={index}
                sx={{
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                  borderRadius: "50%",
                  bgcolor: isActive ? "primary.main" : "text.secondary",
                  opacity: isActive ? 1 : 0.8,
                  transition: "width 180ms ease, height 180ms ease, background-color 180ms ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                }}
              />
            );
          })}
        </Box>

        <Button fullWidth onClick={onNext} variant="contained">
          {isLastStep ? "Finalizar" : "Siguiente"}
        </Button>
        <Button
          fullWidth
          aria-hidden={isLastStep}
          color="secondary"
          onClick={onSkip}
          tabIndex={isLastStep ? -1 : 0}
          variant="text"
          sx={{ visibility: isLastStep ? "hidden" : "visible" }}
        >
          Omitir
        </Button>
      </Stack>
    </Box>
  );
}
