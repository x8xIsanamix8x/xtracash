import { ArrowOutwardRounded, TrendingUpRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import type { OnboardingMasterProgress } from "@/features/home/types";
import { getMasterOnboardingMessage, MASTER_ONBOARDING_URL } from "../presentation";

export function MasterOnboardingProfileCard({ progress }: Readonly<{ progress: OnboardingMasterProgress }>) {
  const message = getMasterOnboardingMessage(progress);
  return (
    <Card component="section" variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box aria-hidden="true" sx={{ width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "background.default", color: "primary.main" }}><TrendingUpRounded /></Box>
            <Stack spacing={0.5}>
              <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>{message.completed ? "Información completada" : "Continúa aumentando tu límite de crédito"}</Typography>
              <Typography color="text.secondary" variant="body2">{message.description}</Typography>
            </Stack>
          </Stack>
          {!message.completed && <Button component="a" href={MASTER_ONBOARDING_URL} target="_blank" rel="noopener noreferrer" endIcon={<ArrowOutwardRounded />} fullWidth variant="outlined">Continuar onboarding</Button>}
        </Stack>
      </CardContent>
    </Card>
  );
}
