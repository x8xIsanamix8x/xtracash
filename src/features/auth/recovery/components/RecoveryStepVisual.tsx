import {
  CheckCircleRounded,
  LockResetRounded,
  PasswordRounded,
  PinRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

export type RecoveryVisualKey = "request" | "code" | "password" | "success";

const visualContent = {
  request: {
    icon: LockResetRounded,
    message: "Recupera tu acceso de forma segura.",
    orbPosition: { top: "-36%", left: "58%" },
  },
  code: {
    icon: PinRounded,
    message: "Confirma el código enviado a tu contacto.",
    orbPosition: { top: "42%", left: "-18%" },
  },
  password: {
    icon: PasswordRounded,
    message: "Protege tu cuenta con una nueva contraseña.",
    orbPosition: { top: "-30%", left: "-14%" },
  },
  success: {
    icon: CheckCircleRounded,
    message: "Tu acceso está listo nuevamente.",
    orbPosition: { top: "36%", left: "60%" },
  },
} as const;

type RecoveryStepVisualProps = Readonly<{
  visualKey: RecoveryVisualKey;
}>;

export function RecoveryStepVisual({ visualKey }: RecoveryStepVisualProps) {
  const content = visualContent[visualKey];
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
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.08)} 55%, ${alpha(themeTokens.color.accent, 0.1)} 100%)`,
      })}
    >
      <Box
        sx={(theme) => ({
          position: "absolute",
          width: { xs: 150, sm: 210, lg: "82%" },
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          ...content.orbPosition,
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          right: { xs: "8%", lg: "-22%" },
          bottom: { xs: "-64%", lg: "-16%" },
          width: { xs: 130, sm: 170, lg: "76%" },
          aspectRatio: "1",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.24),
          borderRadius: "50%",
        })}
      />
      <Box
        sx={(theme) => ({
          position: "absolute",
          top: "58%",
          right: "-8%",
          left: "-8%",
          height: 2,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.primary.main, 0.16),
          transform: `rotate(${visualKey === "code" ? "8deg" : "-7deg"})`,
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
          zIndex: 1,
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
          fontSize: "1rem",
          fontWeight: 700,
          lineHeight: 1.45,
          textAlign: "center",
        }}
      >
        {content.message}
      </Box>
    </Box>
  );
}
