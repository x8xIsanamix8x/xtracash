"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CloseRounded, NotificationsActiveOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { themeTokens } from "@/theme/tokens";

import { hasSeenPushGuide, markPushGuideSeen } from "./pushGuidePreference";

type PushNotificationsGuideProps = Readonly<{
  autoOpen: boolean;
  busy: boolean;
  failed: boolean;
  onEnable: () => Promise<void>;
}>;

export function PushNotificationsGuide({ autoOpen, busy, failed, onEnable }: PushNotificationsGuideProps) {
  const [open, setOpen] = useState(false);
  const preferenceCheckedRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (!autoOpen || preferenceCheckedRef.current) return;
    const timeout = window.setTimeout(() => {
      preferenceCheckedRef.current = true;
      if (!hasSeenPushGuide()) {
        setOpen(true);
        markPushGuideSeen();
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [autoOpen]);

  const closeGuide = () => {
    if (!busy) setOpen(false);
  };

  return (
    <Dialog
      aria-describedby="push-notifications-guide-description"
      aria-labelledby="push-notifications-guide-title"
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
        <IconButton aria-label="Cerrar aviso de notificaciones" disabled={busy} onClick={closeGuide} sx={{ color: "common.white", "&.Mui-disabled": { color: "rgba(255,255,255,0.5)" } }}>
          <CloseRounded />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: "8px !important", pb: 1, textAlign: "center" }}>
        <Typography sx={{ color: "#FFB36B", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Mantente al día
        </Typography>
        <Typography
          component="h2"
          id="push-notifications-guide-title"
          ref={titleRef}
          tabIndex={-1}
          sx={{ mt: 1.25, fontSize: { xs: "1.875rem", sm: "2rem" }, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, textWrap: "balance", "&:focus": { outline: "none" }, "@media (max-height: 640px)": { fontSize: "1.5rem" } }}
        >
          Activa tus notificaciones
        </Typography>
        <Box sx={{ width: "min(100%, 220px)", mx: "auto", my: 2.5, "@media (max-height: 640px)": { width: "min(100%, 140px)", my: 1.5 } }}>
          <Image
            alt="Nuestra mascota de Impúlsate activando las notificaciones junto a una campana"
            height={1254}
            loading="eager"
            sizes="220px"
            src="/notification-guide/mascota-notificaciones.png"
            width={1254}
            style={{ display: "block", width: "100%", height: "auto", borderRadius: "1.5rem" }}
          />
        </Box>
        <Typography id="push-notifications-guide-description" sx={{ fontSize: 14, lineHeight: 1.55, color: "#E1DFFF" }}>
          Recibe en este dispositivo avisos de tus pagos, vencimientos y financiamientos.
        </Typography>
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3, "@media (max-height: 640px)": { display: "none" } }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Actívalas con un toque</Typography>
          <Typography sx={{ mt: 0.75, fontSize: 12, lineHeight: 1.5, color: "#E1DFFF" }}>
            Cuando el navegador lo solicite, elige Permitir.
          </Typography>
        </Box>
        {failed && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, textAlign: "left" }}>
            No pudimos activar las notificaciones. Inténtalo nuevamente.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ flexDirection: "column", gap: 0.5, px: { xs: 2.5, sm: 3 }, pt: 2, pb: 2, "& > :not(style) ~ :not(style)": { ml: 0 } }}>
        <Button
          disabled={busy}
          fullWidth
          onClick={() => void onEnable()}
          startIcon={busy ? <CircularProgress color="inherit" size={18} /> : <NotificationsActiveOutlined />}
          type="button"
          variant="contained"
          sx={{ minHeight: 48, borderRadius: 99, bgcolor: themeTokens.color.accent, color: "secondary.main", fontWeight: 800, "&:hover": { bgcolor: "#FF922E" }, "&.Mui-disabled": { bgcolor: "rgba(255,121,0,0.5)", color: "rgba(255,255,255,0.7)" } }}
        >
          {busy ? "Activando…" : "Activar notificaciones"}
        </Button>
        <Button disabled={busy} fullWidth onClick={closeGuide} sx={{ minHeight: 44, borderRadius: 99, color: "common.white", "&.Mui-disabled": { color: "rgba(255,255,255,0.5)" } }}>
          Ahora no
        </Button>
      </DialogActions>
    </Dialog>
  );
}
