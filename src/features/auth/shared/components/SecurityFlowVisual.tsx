import type { SvgIconComponent } from "@mui/icons-material";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

type SecurityFlowVisualProps = Readonly<{
  icon: SvgIconComponent;
  message: string;
}>;

export function SecurityFlowVisual({ icon: VisualIcon, message }: SecurityFlowVisualProps) {
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
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.09)} 62%, ${alpha(themeTokens.color.accent, 0.1)} 100%)`,
      })}
    >
      <Box
        sx={(theme) => ({
          position: "absolute",
          width: { xs: 150, sm: 210, lg: "82%" },
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          top: "-36%",
          left: "58%",
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
          transform: "rotate(-7deg)",
        })}
      />
      <Box sx={{ position: "absolute", zIndex: 1, inset: 0, display: "grid", placeItems: "center" }}>
        <VisualIcon
          sx={{
            display: "block",
            width: { xs: 72, sm: 96, lg: 136 },
            height: { xs: 72, sm: 96, lg: 136 },
          }}
        />
      </Box>
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
          fontWeight: 700,
          lineHeight: 1.45,
          textAlign: "center",
        }}
      >
        {message}
      </Box>
    </Box>
  );
}
