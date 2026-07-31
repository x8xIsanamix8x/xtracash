import { LoginRounded, VerifiedUserRounded } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

export function AccessVisual() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: "clamp(152px, 30dvh, 280px)",
        aspectRatio: "1",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Box
        sx={(theme) => ({
          position: "absolute",
          inset: "8%",
          borderRadius: "32% 44% 38% 46%",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.55),
          transform: "rotate(-8deg)",
        })}
      />
      <Stack
        spacing={2}
        sx={(theme) => ({
          position: "relative",
          width: "72%",
          aspectRatio: "1",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          bgcolor: alpha(theme.palette.common.white, 0.14),
          color: "common.white",
          border: "1px solid",
          borderColor: alpha(theme.palette.common.white, 0.42),
        })}
      >
        <Typography
          noWrap
          sx={{
            color: themeTokens.color.brandLogo,
            fontSize: "clamp(0.7rem, 2.4vw, 1rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Impúlsate Móvil
        </Typography>
        <LoginRounded sx={{ width: "34%", height: "34%" }} />
      </Stack>
      <Box
        sx={{
          position: "absolute",
          right: "4%",
          bottom: "12%",
          width: "26%",
          aspectRatio: "1",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          border: "4px solid",
          borderColor: "common.white",
        }}
      >
        <VerifiedUserRounded sx={{ width: "58%", height: "58%" }} />
      </Box>
    </Box>
  );
}
