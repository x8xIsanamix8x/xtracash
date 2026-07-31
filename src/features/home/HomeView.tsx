"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Container, Snackbar, Stack } from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import { CreditLineStatusNotice } from "@/features/credit-line";

import { AppHeader } from "./components/AppHeader";
import {
  CreditOverviewState,
  type CreditOverviewStatus,
} from "./components/CreditOverviewState";
import { CreditSummary } from "./components/CreditSummary";
import { RecentActivity } from "./components/RecentActivity";
import { financingScenarioMocks, homeMock } from "./mocks/home";

export function HomeView() {
  const financing =
    financingScenarioMocks[homeMock.initialFinancingStatus];
  const [notice, setNotice] = useState("");
  const [overviewStatus, setOverviewStatus] = useState<CreditOverviewStatus>(
    homeMock.initialOverviewStatus,
  );
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
    }
  }, []);

  const showMobilePaymentNotice = () => {
    setNotice(
      "La solicitud de Pago Móvil estará disponible en la siguiente etapa.",
    );
  };

  const showReportPaymentNotice = () => {
    setNotice(
      "El reporte de pagos estará disponible en la siguiente etapa.",
    );
  };

  const retryCreditOverview = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
    }

    setOverviewStatus("loading");
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setOverviewStatus("ready");
    }, 600);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        pt: "calc(24px + env(safe-area-inset-top))",
        pb: "calc(104px + env(safe-area-inset-bottom))",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <AppHeader
            firstName={homeMock.user.firstName}
            onNotifications={() => setNotice(
              "Las notificaciones estarán disponibles en la siguiente etapa.",
            )}
          />

          {overviewStatus === "ready" ? (
            <>
              <CreditLineStatusNotice
                onReportPayment={showReportPaymentNotice}
                status={financing.status}
              />
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  alignItems: "stretch",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1fr) minmax(0, 1fr)",
                  },
                }}
              >
                <CreditSummary
                  financing={financing}
                  onReportPayment={showReportPaymentNotice}
                  onRequestMobilePayment={showMobilePaymentNotice}
                />
                <RecentActivity items={homeMock.recentActivity} />
              </Box>
            </>
          ) : (
            <CreditOverviewState
              onRetry={retryCreditOverview}
              status={overviewStatus}
            />
          )}
        </Stack>
      </Container>

      <AppBottomNavigation
        activeItem="home"
        onUnavailable={(label) => setNotice(
          `${label} estará disponible en la siguiente etapa.`,
        )}
      />
      <Snackbar
        autoHideDuration={2800}
        message={
          <Box component="span" role="status" aria-live="polite">
            {notice}
          </Box>
        }
        onClose={() => setNotice("")}
        open={Boolean(notice)}
        sx={{
          bottom: "calc(72px + env(safe-area-inset-bottom)) !important",
        }}
      />
    </Box>
  );
}
