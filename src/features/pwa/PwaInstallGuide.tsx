"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowForwardRounded, CloseRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import { hasSeenInstallGuide, markInstallGuideSeen } from "./installGuidePreference";
import { usePwaInstall } from "./PwaProvider";

export function PwaInstallGuide({ autoOpen }: Readonly<{ autoOpen: boolean }>) {
  const { installAvailability } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const preferenceCheckedRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const canInstall = installAvailability === "prompt" || installAvailability === "ios";

  useEffect(() => {
    if (!autoOpen || !canInstall || preferenceCheckedRef.current) return;
    const timeout = window.setTimeout(() => {
      preferenceCheckedRef.current = true;
      if (!hasSeenInstallGuide()) setOpen(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [autoOpen, canInstall]);

  const closeGuide = () => {
    markInstallGuideSeen();
    setOpen(false);
  };

  return (
    <Dialog
      aria-describedby="pwa-install-guide-description"
      aria-labelledby="pwa-install-guide-title"
      fullWidth
      maxWidth="xs"
      onClose={closeGuide}
      open={open && autoOpen && canInstall}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(2, 0, 40, 0.6)", backdropFilter: "blur(4px)" },
        },
        paper: {
          sx: {
            m: 2,
            width: "calc(100% - 32px)",
            maxWidth: 420,
            maxHeight: "calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
            borderRadius: "2rem",
            bgcolor: "secondary.main",
            color: "common.white",
            backgroundImage: "radial-gradient(ellipse at top left, rgba(60, 68, 209, 0.4), transparent 60%)",
            overflow: "hidden",
            "& .MuiButtonBase-root:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 },
          },
        },
        transition: { onEntered: () => titleRef.current?.focus({ preventScroll: true }) },
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 2.5, pt: 1.5, pb: 1, flexShrink: 0 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 32, height: 36, borderRadius: 2, bgcolor: "common.white" }}>
            <Image alt="" height={28} src="/entry/isotipo-impulsa.png" width={24} style={{ objectFit: "contain" }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
            Impúlsate <Box component="span" sx={{ color: "#FFB36B" }}>Móvil</Box>
          </Typography>
        </Stack>
        <IconButton aria-label="Cerrar aviso de instalación" onClick={closeGuide} sx={{ color: "common.white" }}>
          <CloseRounded />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: "8px !important", pb: 1, textAlign: "center" }}>
        <Typography sx={{ color: "#FFB36B", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Un acceso más rápido
        </Typography>
        <Typography
          component="h2"
          id="pwa-install-guide-title"
          ref={titleRef}
          tabIndex={-1}
          sx={{ mt: 1.25, fontSize: { xs: "1.875rem", sm: "2rem" }, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, textWrap: "balance", "&:focus": { outline: "none" }, "@media (max-height: 640px)": { fontSize: "1.5rem" } }}
        >
          Instala Impúlsate Móvil
        </Typography>
        <Box sx={{ width: "min(100%, 220px)", mx: "auto", my: 2.5, "@media (max-height: 640px)": { width: "min(100%, 140px)", my: 1.5 } }}>
          <Image
            alt="Nuestra mascota de Impúlsate mostrando la app en un teléfono"
            height={1254}
            loading="eager"
            sizes="220px"
            src="/install-guide/mascota-instalar.png"
            width={1254}
            style={{ display: "block", width: "100%", height: "auto", borderRadius: "1.5rem" }}
          />
        </Box>
        <Typography id="pwa-install-guide-description" sx={{ fontSize: 14, lineHeight: 1.55, color: "#E1DFFF" }}>
          Entra a <Box component="strong">Perfil</Box> y abre la sección{" "}
          <Box component="strong">Instalar</Box> para agregar la app a tu dispositivo.
        </Typography>
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3, "@media (max-height: 640px)": { display: "none" } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Perfil</Typography>
            <ArrowForwardRounded aria-hidden="true" sx={{ fontSize: 18, color: "#FFB36B" }} />
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Instalar</Typography>
          </Stack>
          <Typography sx={{ mt: 0.75, fontSize: 12, lineHeight: 1.5, color: "#E1DFFF" }}>
            Accede a Impúlsate desde tu pantalla de inicio.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: "column", gap: 0.5, px: { xs: 2.5, sm: 3 }, pt: 2, pb: 2, "& > :not(style) ~ :not(style)": { ml: 0 } }}>
        <Button
          component={Link}
          endIcon={<ArrowForwardRounded />}
          fullWidth
          href="/profile?tab=install"
          onClick={closeGuide}
          variant="contained"
          sx={{ minHeight: 48, borderRadius: 99, bgcolor: themeTokens.color.accent, color: "secondary.main", fontWeight: 800, "&:hover": { bgcolor: "#FF922E" } }}
        >
          Ir a Perfil
        </Button>
        <Button fullWidth onClick={closeGuide} sx={{ minHeight: 44, borderRadius: 99, color: "common.white" }}>
          Ahora no
        </Button>
      </DialogActions>
    </Dialog>
  );
}
