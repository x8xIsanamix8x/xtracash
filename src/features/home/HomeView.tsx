"use client";

import { useState } from "react";
import { AddRounded } from "@mui/icons-material";
import { Box, Button, Container, Snackbar, Stack } from "@mui/material";

import { AppBottomNavigation } from "./components/AppBottomNavigation";
import { AppHeader } from "./components/AppHeader";
import { CreditCard } from "./components/CreditCard";
import { CreditSummary } from "./components/CreditSummary";
import { RecentActivity } from "./components/RecentActivity";
import { homeMock } from "./mocks/home";

export function HomeView() {
  const [notice, setNotice] = useState("");

  const showPaymentNotice = () => {
    setNotice("Los pagos estarán disponibles en la siguiente etapa.");
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
            onProfile={() => setNotice("El perfil estará disponible en la siguiente etapa.")}
          />

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
                onClick={() => setNotice("La solicitud de crédito estará disponible en la siguiente etapa.")}
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
        </Stack>
      </Container>

      <AppBottomNavigation
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
