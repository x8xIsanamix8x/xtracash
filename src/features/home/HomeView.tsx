"use client";

import { useEffect, useRef, useState } from "react";
import { AddRounded } from "@mui/icons-material";
import { Box, Button, Container, Snackbar, Stack } from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import {
  CreditLineStatusNotice,
  isCreditLineUsable,
} from "@/features/credit-line";

import { AppHeader } from "./components/AppHeader";
import { CreditCard } from "./components/CreditCard";
import {
  CreditOverviewState,
  type CreditOverviewStatus,
} from "./components/CreditOverviewState";
import { CreditSummary } from "./components/CreditSummary";
import { RecentActivity } from "./components/RecentActivity";
import { homeMock } from "./mocks/home";

export function HomeView() {
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

  const showPaymentNotice = () => {
    setNotice("Los pagos estarán disponibles en la siguiente etapa.");
  };

  const showCreditRequestNotice = () => {
    setNotice("La solicitud de crédito estará disponible en la siguiente etapa.");
  };

  const showHelpNotice = () => {
    setNotice("La asistencia estará disponible en la siguiente etapa.");
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
            onNotifications={() => setNotice("Las notificaciones estarán disponibles en la siguiente etapa.")}
          />

          {overviewStatus === "ready" ? (
            <>
              {!isCreditLineUsable(homeMock.card.lineStatus) && (
                <CreditLineStatusNotice
                  onHelp={showHelpNotice}
                  onPayDebt={showPaymentNotice}
                  status={homeMock.card.lineStatus}
                />
              )}
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  alignItems: "start",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
                }}
              >
                <Stack spacing={2} sx={{ minWidth: 0 }}>
                  <CreditCard {...homeMock.card} />
                  <Button
                    fullWidth
                    onClick={showCreditRequestNotice}
                    startIcon={<AddRounded />}
                    variant="contained"
                  >
                    Solicitar crédito
                  </Button>
                </Stack>
                <CreditSummary
                  {...homeMock.credit}
                  onPay={showPaymentNotice}
                />
              </Box>

              <RecentActivity items={homeMock.activity} />
            </>
          ) : (
            <CreditOverviewState
              onRequestCredit={showCreditRequestNotice}
              onRetry={retryCreditOverview}
              status={overviewStatus}
            />
          )}
        </Stack>
      </Container>

      <AppBottomNavigation
        activeItem="home"
        onUnavailable={(label) => setNotice(`${label} estará disponible en la siguiente etapa.`)}
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
