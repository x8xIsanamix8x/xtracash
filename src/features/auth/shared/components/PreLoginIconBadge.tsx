import type { SvgIconComponent } from "@mui/icons-material";
import { Box } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

type PreLoginIconBadgeProps = Readonly<{
  icon: SvgIconComponent;
  size?: number;
}>;

// Icon-in-circle badge for the pre-login screens: a plain MUI glyph on soft lavender rings,
// instead of the Figma's cartoon illustrations (team feedback, 2026-09-22: no caricatures, but
// not too "core bancario" either). Same visual language MUI icon usage already has elsewhere
// (Profile's biometric section, SecurityFlowVisual), just restyled with the Figma palette.
export function PreLoginIconBadge({ icon: Icon, size = 142 }: PreLoginIconBadgeProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: "rgba(70, 55, 245, 0.1)",
      }}
    >
      <Box
        sx={{
          width: "72%",
          height: "72%",
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "rgba(70, 55, 245, 0.2)",
        }}
      >
        <Icon sx={{ width: "44%", height: "44%", color: themeTokens.color.preLoginPrimary }} />
      </Box>
    </Box>
  );
}
