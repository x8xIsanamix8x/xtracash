import {
  CheckCircleRounded,
  PasswordRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

export type ChangePasswordVisualKey = "verification" | "new-password" | "success";

const visuals = {
  verification: {
    icon: VerifiedUserRounded,
    message: "Confirma tu identidad antes de continuar.",
  },
  "new-password": {
    icon: PasswordRounded,
    message: "Crea una contraseña segura para tu cuenta.",
  },
  success: {
    icon: CheckCircleRounded,
    message: "Tu proceso se completó correctamente.",
  },
} as const;

type ChangePasswordVisualProps = Readonly<{
  visualKey: ChangePasswordVisualKey;
}>;

export function ChangePasswordVisual({ visualKey }: ChangePasswordVisualProps) {
  const content = visuals[visualKey];
  const VisualIcon = content.icon;

  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        position: "relative",
        width: "100%",
        height: { xs: 134, sm: 176, lg: "100%" },
        minHeight: { lg: 440 },
        overflow: "hidden",
        pointerEvents: "none",
        color: "secondary.main",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.1)} 70%, ${alpha(themeTokens.color.accent, 0.1)} 100%)`,
      })}
    >
      <Box
        sx={(theme) => ({
          position: "absolute",
          top: visualKey === "verification" ? "-34%" : "38%",
          left: visualKey === "verification" ? "58%" : "-18%",
          width: { xs: 150, sm: 210, lg: "82%" },
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          right: { xs: "8%", lg: "-20%" },
          bottom: { xs: "-62%", lg: "-16%" },
          width: { xs: 130, sm: 170, lg: "76%" },
          aspectRatio: "1",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.24),
          borderRadius: "50%",
        })}
      />
      <VisualIcon
        sx={{
          position: "absolute",
          zIndex: 1,
          top: "50%",
          left: { xs: "42%", lg: "50%" },
          width: { xs: 72, sm: 96, lg: 136 },
          height: { xs: 72, sm: 96, lg: 136 },
          transform: "translate(-50%, -50%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "18%",
          right: "14%",
          width: { xs: 12, lg: 18 },
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: themeTokens.color.accent,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
          right: 4,
          bottom: 4,
          left: 4,
          display: { xs: "none", lg: "block" },
          color: "secondary.main",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {content.message}
      </Box>
    </Box>
  );
}
