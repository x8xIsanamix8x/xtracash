"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftRounded } from "@mui/icons-material";
import {
  Box,
  Container,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { AppBottomNavigation } from "@/components/AppBottomNavigation";
import {
  SignOutDialog,
  type SessionStatus,
} from "@/features/auth";
import { signOut } from "@/features/auth/session/services/session";
import { sessionExpiredUrl } from "@/lib/accessNotificationNavigation";
import { PwaInstallCard } from "@/features/pwa/PwaInstallCard";
import { MasterOnboardingProfileCard, resetMasterOnboardingPrompt } from "@/features/master-onboarding";
import { getAccountSummary } from "@/features/home/services/accountSummary";
import type { OnboardingMasterProgress } from "@/features/home/types";
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

type ProfileTab = "information" | "security" | "install";

const profileTabs: readonly Readonly<{
  id: ProfileTab;
  label: string;
}>[] = [
  { id: "information", label: "Información" },
  { id: "security", label: "Seguridad" },
  { id: "install", label: "Instalar" },
];

export function ProfileView({ biometricEnabled = false }: Readonly<{ biometricEnabled?: boolean }>) {
  const router = useRouter();
  const showBiometricAccess = biometricEnabled;
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [personalInfo, setPersonalInfo] = useState<ProfilePersonalInfo | null>(
    null,
  );
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("active");
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>("information");
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [masterOnboardingProgress, setMasterOnboardingProgress] = useState<OnboardingMasterProgress | null>(null);
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

  useEffect(() => {
    const controller = new AbortController();
    void getAccountSummary(controller.signal)
      .then((summary) => setMasterOnboardingProgress(summary.onboardingMaster))
      .catch(() => { /* The profile remains available if summary progress cannot load. */ });
    return () => controller.abort();
  }, []);

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
      resetMasterOnboardingPrompt();
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
            sx={{ minHeight: 48, alignItems: "center", justifyContent: "space-between" }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "#ECEBFF",
              }}
            >
              <Image
                alt=""
                aria-hidden="true"
                height={32}
                priority
                src="/entry/isotipo-impulsa.png"
                style={{ objectFit: "contain" }}
                width={26}
              />
            </Box>
            <Typography
              component="h1"
              ref={titleRef}
              tabIndex={-1}
              sx={{
                color: "secondary.main",
                fontSize: "1rem",
                fontWeight: 600,
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
            <IconButton
              aria-label="Volver al inicio"
              component={Link}
              href="/home"
              sx={{
                width: 44,
                minWidth: 44,
                minHeight: 44,
                color: "#FF7900",
                "& .MuiSvgIcon-root": {
                  bgcolor: "#FF7900",
                  color: "common.white",
                  borderRadius: 1,
                  fontSize: "1.75rem",
                },
              }}
            >
              <ChevronLeftRounded />
            </IconButton>
          </Stack>

          {status === "ready" && user ? (
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    md: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
                  },
                  alignItems: "start",
                }}
              >
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                  <ProfileSummary user={user} />
                  {masterOnboardingProgress && (
                    <MasterOnboardingProfileCard progress={masterOnboardingProgress} />
                  )}
                </Stack>

                <Box sx={{ minWidth: 0 }}>
                  <Tabs
                    aria-label="Secciones del perfil"
                    onChange={(_event, value: ProfileTab) => setActiveProfileTab(value)}
                    value={activeProfileTab}
                    variant="fullWidth"
                    sx={{
                      minHeight: 48,
                      p: 0.5,
                      borderRadius: 2.5,
                      bgcolor: "#E9EAF2",
                      "& .MuiTabs-indicator": { display: "none" },
                      "& .MuiTab-root": {
                        minWidth: 0,
                        minHeight: 44,
                        px: { xs: 0.75, sm: 1.5 },
                        borderRadius: 2,
                        color: "text.secondary",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        fontWeight: 700,
                        textTransform: "none",
                      },
                      "& .MuiTab-root.Mui-selected": {
                        bgcolor: "background.paper",
                        color: "secondary.main",
                        boxShadow: "0 3px 10px rgba(2, 0, 77, 0.1)",
                      },
                    }}
                  >
                    {profileTabs.map((tab) => (
                      <Tab
                        aria-controls={`profile-panel-${tab.id}`}
                        id={`profile-tab-${tab.id}`}
                        key={tab.id}
                        label={tab.label}
                        value={tab.id}
                      />
                    ))}
                  </Tabs>

                  <Box
                    aria-labelledby="profile-tab-information"
                    hidden={activeProfileTab !== "information"}
                    id="profile-panel-information"
                    role="tabpanel"
                    sx={{ mt: 2 }}
                  >
                    <PersonalInformation user={user} />
                  </Box>
                  <Box
                    aria-labelledby="profile-tab-security"
                    hidden={activeProfileTab !== "security"}
                    id="profile-panel-security"
                    role="tabpanel"
                    sx={{ mt: 2 }}
                  >
                    <SecurityCard biometricEnabled={showBiometricAccess} />
                  </Box>
                  <Box
                    aria-labelledby="profile-tab-install"
                    hidden={activeProfileTab !== "install"}
                    id="profile-panel-install"
                    role="tabpanel"
                    sx={{ mt: 2 }}
                  >
                    <PwaInstallCard />
                  </Box>
                </Box>
              </Box>

              <SessionCard onSignOut={openSignOut} />
            </Stack>
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
