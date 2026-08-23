"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Snackbar, Stack } from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import { CreditLineStatusNotice } from "@/features/credit-line";
import { PaymentReportFlow } from "@/features/payment-report";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";

import { AppHeader } from "./components/AppHeader";
import {
  CreditOverviewState,
  type CreditOverviewStatus,
} from "./components/CreditOverviewState";
import { CreditSummary } from "./components/CreditSummary";
import { RecentActivity } from "./components/RecentActivity";
import {
  createFinancingSummary,
  createRecentActivity,
  getFirstName,
} from "./presentation";
import {
  AccountSummaryServiceError,
  getAccountSummary,
} from "./services/accountSummary";
import type { HomeAccountSummary } from "./types";

export function HomeView() {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [overviewStatus, setOverviewStatus] = useState<CreditOverviewStatus>(
    "loading",
  );
  const [summary, setSummary] = useState<HomeAccountSummary | null>(null);
  const [isPaymentReportOpen, setIsPaymentReportOpen] = useState(false);
  const requestRef = useRef<{
    controller: AbortController;
    id: number;
  } | null>(null);
  const requestIdRef = useRef(0);

  const loadSummary = useCallback(() => {
    requestRef.current?.controller.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    requestRef.current = { controller, id: requestId };

    void getAccountSummary(controller.signal)
      .then((nextSummary) => {
        if (requestRef.current?.id !== requestId) return;

        setSummary(nextSummary);
        setOverviewStatus(
          nextSummary.accountStatus !== "ACTIVE"
            ? "unavailable"
            : nextSummary.product === null
              ? "empty"
              : "ready",
        );
      })
      .catch((error: unknown) => {
        if (requestRef.current?.id !== requestId) return;
        if (
          error instanceof AccountSummaryServiceError
          && error.type === "aborted"
        ) {
          return;
        }

        setSummary(null);
        if (
          error instanceof AccountSummaryServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }

        setOverviewStatus("error");
      })
      .finally(() => {
        if (requestRef.current?.id === requestId) {
          requestRef.current = null;
        }
      });
  }, [router]);

  useEffect(() => {
    void loadSummary();

    return () => {
      requestRef.current?.controller.abort();
      requestRef.current = null;
    };
  }, [loadSummary]);

  const openPaymentReport = () => setIsPaymentReportOpen(true);

  const retryCreditOverview = () => {
    setOverviewStatus("loading");
    void loadSummary();
  };

  const financing = summary?.product
    ? createFinancingSummary(summary.product, summary.payments)
    : null;
  const recentActivity = summary
    ? createRecentActivity(summary.movements)
    : [];

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
            firstName={summary ? getFirstName(summary.name) : null}
            onNotifications={() => setNotice(
              "Las notificaciones estarán disponibles en la siguiente etapa.",
            )}
          />

          {overviewStatus === "ready" && financing ? (
            <>
              <CreditLineStatusNotice
                onReportPayment={openPaymentReport}
                showReportPaymentAction={financing.hasPendingPayment}
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
                  onReportPayment={openPaymentReport}
                />
                <RecentActivity items={recentActivity} />
              </Box>
            </>
          ) : (
            <CreditOverviewState
              onRetry={retryCreditOverview}
              status={overviewStatus === "ready" ? "error" : overviewStatus}
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
      <PaymentReportFlow
        currentDebtBs={summary?.payments.currentDebtBs ?? null}
        minimumPaymentBs={summary?.payments.minimumPaymentBs ?? null}
        onClose={() => setIsPaymentReportOpen(false)}
        open={isPaymentReportOpen}
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
