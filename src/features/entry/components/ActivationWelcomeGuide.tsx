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

import { hasSeenActivationGuide, markActivationGuideSeen } from "../lib/activationGuidePreference";

export function ActivationWelcomeGuide({ autoOpen }: Readonly<{ autoOpen: boolean }>) {
  const [open, setOpen] = useState(false);
  const preferenceCheckedRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (!autoOpen || preferenceCheckedRef.current) return;
    const timeout = window.setTimeout(() => {
      preferenceCheckedRef.current = true;
      if (!hasSeenActivationGuide()) {
        markActivationGuideSeen();
        setOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [autoOpen]);

  const closeGuide = () => setOpen(false);

  return (
    <Dialog
      aria-describedby="activation-welcome-description"
      aria-labelledby="activation-welcome-title"
      fullWidth
      maxWidth="xs"
      onClose={closeGuide}
      open={open && autoOpen}
      transitionDuration={prefersReducedMotion ? 0 : undefined}
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(2, 0, 40, 0.6)", backdropFilter: "blur(4px)" } },
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
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 32, height: 36, borderRadius: 2, bgcolor: "common.white" }}>
            <Image alt="" height={28} src="/entry/isotipo-impulsa.png" width={24} style={{ objectFit: "contain" }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
            Impúlsate <Box component="span" sx={{ color: "#FFB36B" }}>Móvil</Box>
          </Typography>
        </Stack>
        <IconButton aria-label="Cerrar bienvenida de activación" onClick={closeGuide} sx={{ color: "common.white" }}>
          <CloseRounded />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: "8px !important", pb: 1, textAlign: "center" }}>
        <Typography sx={{ color: "#FFB36B", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          ¡Te damos la bienvenida!
        </Typography>
        <Typography
          component="h2"
          id="activation-welcome-title"
          ref={titleRef}
          tabIndex={-1}
          sx={{ mt: 1.25, fontSize: { xs: "1.875rem", sm: "2rem" }, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, textWrap: "balance", "&:focus": { outline: "none" }, "@media (max-height: 640px)": { fontSize: "1.5rem" } }}
        >
          Activa tu cuenta
        </Typography>
        <Box sx={{ width: "min(100%, 220px)", mx: "auto", my: 2.5, "@media (max-height: 640px)": { width: "min(100%, 140px)", my: 1.5 } }}>
          <Image
            alt="Nuestra mascota de Impúlsate te da la bienvenida con un teléfono y un candado abierto"
            height={1262}
            loading="eager"
            sizes="220px"
            src="/entry/mascota-activar-cuenta.png"
            width={1246}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </Box>
        <Typography id="activation-welcome-description" sx={{ fontSize: 14, lineHeight: 1.55, color: "#E1DFFF" }}>
          
        </Typography>
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3, "@media (max-height: 640px)": { display: "none" } }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Tu invitación es el primer paso</Typography>
          <Typography sx={{ mt: 0.75, fontSize: 12, lineHeight: 1.5, color: "#E1DFFF" }}>
            Usa el correo de tu invitación para recibir el enlace y crear tu contraseña.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: "column", gap: 0.5, px: { xs: 2.5, sm: 3 }, pt: 2, pb: 2, "& > :not(style) ~ :not(style)": { ml: 0 } }}>
        <Button
          component={Link}
          endIcon={<ArrowForwardRounded />}
          fullWidth
          href="/recover-password?mode=activation"
          onClick={closeGuide}
          variant="contained"
          sx={{ minHeight: 48, borderRadius: 99, bgcolor: themeTokens.color.accent, color: "secondary.main", fontWeight: 800, "&:hover": { bgcolor: "#FF922E" } }}
        >
          Activa tu cuenta
        </Button>
        <Button fullWidth onClick={closeGuide} sx={{ minHeight: 44, borderRadius: 99, color: "common.white" }}>
          Ya tengo una cuenta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
