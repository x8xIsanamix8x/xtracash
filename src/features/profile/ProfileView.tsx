"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowBackRounded } from "@mui/icons-material";
import { Box, Container, IconButton, Snackbar, Stack, Typography } from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import { themeTokens } from "@/theme/tokens";

import { PersonalInformation } from "./components/PersonalInformation";
import { ProfileState } from "./components/ProfileState";
import { ProfileSummary } from "./components/ProfileSummary";
import { SecurityCard } from "./components/SecurityCard";
import { profileMock } from "./mocks/profile";
import type { ProfileStatus } from "./types";

export function ProfileView() {
  const [status, setStatus] = useState<ProfileStatus>(profileMock.initialStatus);
  const [notice, setNotice] = useState("");
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
    }
  }, []);

  const retryProfile = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
    }

    setStatus("loading");
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setStatus("ready");
    }, profileMock.retryDelay);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        pt: "calc(16px + env(safe-area-inset-top))",
        pb: "calc(104px + env(safe-area-inset-bottom))",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack
            component="header"
            direction="row"
            spacing={1}
            sx={{ minHeight: 48, alignItems: "center" }}
          >
            <IconButton
              aria-label="Volver al inicio"
              color="primary"
              component={Link}
              href="/home"
            >
              <ArrowBackRounded />
            </IconButton>
            <Typography
              component="h1"
              variant="h4"
              sx={{ flex: 1, color: "secondary.main", fontWeight: 700 }}
            >
              Perfil
            </Typography>
            <Typography
              sx={{
                color: themeTokens.color.brandLogo,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              XtraCash
            </Typography>
          </Stack>

          {status === "ready" ? (
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateAreas: {
                  xs: '"summary" "information" "security"',
                  md: '"summary information" "security information"',
                },
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
                },
                alignItems: "start",
              }}
            >
              <Box sx={{ gridArea: "summary", minWidth: 0 }}>
                <ProfileSummary user={profileMock.user} />
              </Box>
              <Box sx={{ gridArea: "information", minWidth: 0 }}>
                <PersonalInformation user={profileMock.user} />
              </Box>
              <Box sx={{ gridArea: "security", minWidth: 0 }}>
                <SecurityCard />
              </Box>
            </Box>
          ) : (
            <ProfileState onRetry={retryProfile} status={status} />
          )}
        </Stack>
      </Container>

      <AppBottomNavigation
        activeItem="profile"
        onUnavailable={(label) => setNotice(`${label} estará disponible en la siguiente etapa.`)}
      />
      <Snackbar
        autoHideDuration={2800}
        message={
          <Box component="span" aria-live="polite" role="status">
            {notice}
          </Box>
        }
        onClose={() => setNotice("")}
        open={Boolean(notice)}
        sx={{ bottom: "calc(72px + env(safe-area-inset-bottom)) !important" }}
      />
    </Box>
  );
}
