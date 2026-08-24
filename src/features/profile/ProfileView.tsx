"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBackRounded } from "@mui/icons-material";
import { Box, Container, IconButton, Snackbar, Stack, Typography } from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import {
  SignOutDialog,
  type SessionStatus,
} from "@/features/auth";
import { signOut } from "@/features/auth/session/services/session";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { themeTokens } from "@/theme/tokens";

import { PersonalInformation } from "./components/PersonalInformation";
import { ProfileState } from "./components/ProfileState";
import { ProfileSummary } from "./components/ProfileSummary";
import { SecurityCard } from "./components/SecurityCard";
import { SessionCard } from "./components/SessionCard";
import { createProfileData } from "./presentation";
import {
  getProfilePersonalInfo,
  ProfileServiceError,
} from "./services/profile";
import type { ProfilePersonalInfo, ProfileStatus } from "./types";

export function ProfileView() {
  const router = useRouter();
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [personalInfo, setPersonalInfo] = useState<ProfilePersonalInfo | null>(
    null,
  );
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("active");
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const profileRequestRef = useRef<{
    controller: AbortController;
    id: number;
  } | null>(null);
  const requestIdRef = useRef(0);
  const signOutControllerRef = useRef<AbortController | null>(null);
  const signOutSubmissionRef = useRef(false);
  const user = useMemo(
    () => personalInfo === null ? null : createProfileData(personalInfo),
    [personalInfo],
  );

  const loadProfile = useCallback(() => {
    if (profileRequestRef.current !== null) return;

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    profileRequestRef.current = { controller, id: requestId };
    setPersonalInfo(null);
    setStatus("loading");
    setAnnouncement("");

    void getProfilePersonalInfo(controller.signal)
      .then((personalInfo) => {
        if (profileRequestRef.current?.id !== requestId) return;
        setPersonalInfo(personalInfo);
        setStatus("ready");
        setAnnouncement("Perfil cargado.");
      })
      .catch((error: unknown) => {
        if (profileRequestRef.current?.id !== requestId) return;
        if (
          error instanceof ProfileServiceError
          && error.type === "aborted"
        ) {
          return;
        }
        setPersonalInfo(null);

        if (
          error instanceof ProfileServiceError
          && error.type === "unauthenticated"
        ) {
          router.replace(sessionExpiredUrl);
          return;
        }

        setStatus("error");
        setAnnouncement("");
      })
      .finally(() => {
        if (profileRequestRef.current?.id === requestId) {
          profileRequestRef.current = null;
        }
      });
  }, [router]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
    });
    loadProfile();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      profileRequestRef.current?.controller.abort();
      profileRequestRef.current = null;
      signOutControllerRef.current?.abort();
    };
  }, [loadProfile]);

  const retryProfile = () => loadProfile();

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
              ref={titleRef}
              tabIndex={-1}
              variant="h4"
              sx={{
                flex: 1,
                color: "secondary.main",
                fontWeight: 700,
                outline: "none",
                borderRadius: 1,
                "&:focus-visible": {
                  outline: `3px solid ${themeTokens.color.focus}`,
                  outlineOffset: 3,
                },
              }}
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

          {status === "ready" && user ? (
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
                <ProfileSummary user={user} />
              </Box>
              <Box sx={{ gridArea: "information", minWidth: 0 }}>
                <PersonalInformation user={user} />
              </Box>
              <Box sx={{ gridArea: "security", minWidth: 0 }}>
                <SecurityCard />
              </Box>
              <Box sx={{ gridArea: "session", minWidth: 0 }}>
                <SessionCard onSignOut={openSignOut} />
              </Box>
            </Box>
          ) : (
            <ProfileState
              onRetry={retryProfile}
              status={status === "ready" ? "error" : status}
            />
          )}
        </Stack>
      </Container>

      <Box
        aria-live="polite"
        role="status"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          p: 0,
          m: "-1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcement}
      </Box>

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
