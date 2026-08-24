"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBackRounded } from "@mui/icons-material";
import { Box, Container, IconButton, Snackbar, Stack, Typography } from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import {
  SessionExpiredView,
  SignOutDialog,
  type SessionStatus,
} from "@/features/auth";
import { signOut } from "@/features/auth/session/services/session";
import { themeTokens } from "@/theme/tokens";

import { PersonalInformation } from "./components/PersonalInformation";
import { ProfileState } from "./components/ProfileState";
import { ProfileSummary } from "./components/ProfileSummary";
import { SecurityCard } from "./components/SecurityCard";
import { SessionCard } from "./components/SessionCard";
import { profileMock } from "./mocks/profile";
import type { ProfileStatus } from "./types";

export function ProfileView() {
  const router = useRouter();
  const [status, setStatus] = useState<ProfileStatus>(profileMock.initialStatus);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("active");
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutControllerRef = useRef<AbortController | null>(null);
  const signOutSubmissionRef = useRef(false);

  useEffect(() => () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
    }

    signOutControllerRef.current?.abort();
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

  const openSignOut = () => {
    if (sessionStatus === "active") {
      setIsSignOutOpen(true);
    }
  };

  const cancelSignOut = () => {
    if (sessionStatus === "active") {
      setIsSignOutOpen(false);
    }
  };

  const confirmSignOut = async () => {
    if (sessionStatus !== "active" || signOutSubmissionRef.current) {
      return;
    }

    const controller = new AbortController();
    signOutSubmissionRef.current = true;
    signOutControllerRef.current = controller;
    setSessionStatus("signing-out");

    try {
      await signOut(controller.signal);
      router.replace("/");
    } catch {
      if (!controller.signal.aborted) {
        setSessionStatus("active");
        setIsSignOutOpen(false);
        setNotice("No pudimos cerrar la sesión. Inténtalo nuevamente.");
      }
    } finally {
      signOutSubmissionRef.current = false;
      if (signOutControllerRef.current === controller) {
        signOutControllerRef.current = null;
      }
    }
  };

  if (sessionStatus === "expired") {
    return <SessionExpiredView onSignIn={() => router.replace("/")} />;
  }

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
              noWrap
              sx={{
                color: themeTokens.color.brandLogo,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Impúlsate Móvil
            </Typography>
          </Stack>

          {status === "ready" ? (
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateAreas: {
                  xs: '"summary" "information" "security" "session"',
                  md: '"summary information" "security information" "session information"',
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
              <Box sx={{ gridArea: "session", minWidth: 0 }}>
                <SessionCard onSignOut={openSignOut} />
              </Box>
            </Box>
          ) : (
            <ProfileState onRetry={retryProfile} status={status} />
          )}
        </Stack>
      </Container>

      <AppBottomNavigation activeItem="profile" />
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
      <SignOutDialog
        isLoading={sessionStatus === "signing-out"}
        onCancel={cancelSignOut}
        onConfirm={confirmSignOut}
        open={isSignOutOpen}
      />
    </Box>
  );
}
