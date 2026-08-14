import {
  BadgeRounded,
  SecurityRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

export type RegistrationVisualKey = "identity" | "security" | "confirmation";

const visualIcons = {
  identity: BadgeRounded,
  security: SecurityRounded,
  confirmation: VerifiedUserRounded,
} as const;

const compositions = {
  identity: { iconLeft: "22%", orbLeft: "66%", orbTop: "-42%", lineRotation: "-8deg" },
  security: { iconLeft: "50%", orbLeft: "8%", orbTop: "42%", lineRotation: "7deg" },
  confirmation: { iconLeft: "72%", orbLeft: "2%", orbTop: "-48%", lineRotation: "-5deg" },
} as const;

const panelMessages = {
  identity: "Tu información, protegida desde el inicio.",
  security: "Seguridad para acompañar cada decisión.",
  confirmation: "Un último paso para confirmar tu cuenta.",
} as const;

type RegistrationStepVisualProps = Readonly<{
  visualKey: RegistrationVisualKey;
}>;

export function RegistrationStepVisual({ visualKey }: RegistrationStepVisualProps) {
  const VisualIcon = visualIcons[visualKey];
  const composition = compositions[visualKey];
  const panelMessage = panelMessages[visualKey];

  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        position: "relative",
        width: "100%",
        height: { xs: 134, sm: 176, lg: "100%" },
        minHeight: { lg: 440 },
        flexShrink: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${theme.palette.background.paper} 48%, ${alpha(theme.palette.primary.main, 0.16)} 100%)`,
        color: "secondary.main",
      })}
    >
      <Box
        sx={(theme) => ({
          position: "absolute",
          left: composition.orbLeft,
          top: composition.orbTop,
          width: { xs: 148, sm: 190, lg: "78%" },
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          left: visualKey === "security" ? "72%" : "8%",
          bottom: visualKey === "confirmation" ? "-34%" : "-48%",
          width: { xs: 116, sm: 150, lg: "64%" },
          aspectRatio: "1",
          borderRadius: "50%",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.22),
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          left: { xs: "6%", lg: "-8%" },
          right: { xs: "6%", lg: "-8%" },
          top: "56%",
          height: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.18),
          transform: `rotate(${composition.lineRotation})`,
          transformOrigin: "center",
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          left: visualKey === "identity" ? "45%" : "18%",
          top: "26%",
          width: { xs: "34%", sm: "42%", lg: "72%" },
          height: 2,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.primary.main, 0.2),
          transform: `rotate(${composition.lineRotation})`,
        })}
      />
      <VisualIcon
        sx={{
          position: "absolute",
          zIndex: 1,
          left: composition.iconLeft,
          top: "50%",
          width: { xs: 68, sm: 92, lg: 132 },
          height: { xs: 68, sm: 92, lg: 132 },
          transform: "translate(-50%, -50%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          zIndex: 1,
          top: "15%",
          right: visualKey === "confirmation" ? "42%" : "12%",
          width: { xs: 10, sm: 14, lg: 18 },
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: themeTokens.color.accent,
        }}
      />
      {panelMessage && (
        <Box
          sx={{
            position: "absolute",
            zIndex: 2,
            right: 4,
            bottom: 4,
            left: 4,
            display: { xs: "none", lg: "block" },
            color: "secondary.main",
            fontSize: "1rem",
            fontWeight: 700,
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          {panelMessage}
        </Box>
      )}
    </Box>
  );
}
