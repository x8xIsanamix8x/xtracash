import { LoginRounded, VerifiedUserRounded } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";

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
        sx={{
          position: "absolute",
          inset: "8%",
          borderRadius: "32% 44% 38% 46%",
          border: "1px solid",
          borderColor: "secondary.light",
          transform: "rotate(-8deg)",
        }}
      />
      <Stack
        spacing={2}
        sx={{
          position: "relative",
          width: "72%",
          aspectRatio: "1",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          bgcolor: "secondary.light",
          color: "secondary.contrastText",
          border: "1px solid",
          borderColor: "secondary.contrastText",
        }}
      >
        <Typography sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
          xtracash
        </Typography>
        <LoginRounded sx={{ fontSize: "34%" }} />
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
          borderColor: "secondary.main",
        }}
      >
        <VerifiedUserRounded sx={{ fontSize: "58%" }} />
      </Box>
    </Box>
  );
}
