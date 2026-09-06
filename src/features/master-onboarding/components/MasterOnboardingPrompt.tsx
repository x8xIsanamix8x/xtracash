"use client";

import { CelebrationRounded, CloseRounded, TrendingUpRounded } from "@mui/icons-material";
import { Box, Button, Dialog, DialogContent, IconButton, Slide, Stack, Typography, useMediaQuery } from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";
import type { OnboardingMasterProgress } from "@/features/home/types";
import { getMasterOnboardingMessage, MASTER_ONBOARDING_URL } from "../presentation";

function TopNoticeTransition(props: SlideProps) { return <Slide {...props} direction="down" />; }

export function MasterOnboardingPrompt({ onClose, open, progress }: Readonly<{
  onClose: () => void;
  open: boolean;
  progress: OnboardingMasterProgress;
}>) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const message = getMasterOnboardingMessage(progress);
  const Icon = message.completed ? CelebrationRounded : TrendingUpRounded;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      aria-labelledby="master-onboarding-title" aria-describedby="master-onboarding-description"
      slots={{ transition: TopNoticeTransition }} transitionDuration={reducedMotion ? 0 : undefined}
      slotProps={{ container: { sx: { alignItems: { xs: "flex-start", sm: "center" }, pt: { xs: "env(safe-area-inset-top)", sm: 0 } } }, paper: { sx: {
        width: { xs: "100%", sm: "min(480px, calc(100% - 48px))" }, maxWidth: "100%", m: { xs: 0, sm: 2 },
        maxHeight: { xs: "50dvh", sm: "calc(100dvh - 64px)" }, borderRadius: { xs: "0 0 28px 28px", sm: 3 },
      } } }}>
      <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 }, overflowWrap: "anywhere" }}>
        <Stack spacing={2.25} sx={{ alignItems: "center", textAlign: "center" }}>
          <IconButton aria-label="Cerrar aviso de avance" onClick={onClose} sx={{ alignSelf: "flex-end", mt: -1, mr: -1, minWidth: 44, minHeight: 44 }}>
            <CloseRounded />
          </IconButton>
          <Box aria-hidden="true" sx={(theme) => ({ width: 72, height: 72, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" })}>
            <Icon sx={{ fontSize: 40 }} />
          </Box>
          <Stack spacing={1}>
            <Typography component="h2" id="master-onboarding-title" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>{message.title}</Typography>
            <Typography id="master-onboarding-description" color="text.secondary">{message.description}</Typography>
          </Stack>
          {!message.completed && <Button component="a" href={MASTER_ONBOARDING_URL} target="_blank" rel="noopener noreferrer" onClick={onClose} fullWidth variant="contained" sx={{ minHeight: 48 }}>Continuar mi onboarding</Button>}
          <Button fullWidth color="secondary" onClick={onClose} sx={{ minHeight: 44 }}>{message.completed ? "Continuar" : "Ahora no"}</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
