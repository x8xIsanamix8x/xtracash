import { Box } from "@mui/material";

export function SignInVisual() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: { xs: "clamp(210px, 33dvh, 312px)", md: "clamp(330px, 42dvh, 420px)" },
        mx: "auto",
        overflow: "hidden",
        pointerEvents: "none",
        "@media (min-width: 900px) and (max-height: 820px)": {
          height: "clamp(128px, 20dvh, 164px)",
        },
        "@media (max-height: 700px)": {
          height: "clamp(112px, 18dvh, 136px)",
        },
        "@media (max-height: 520px)": {
          height: "clamp(96px, 18dvh, 116px)",
        },
        "@media (max-height: 450px)": {
          display: "none",
        },
      }}
    >
      <Box
        alt=""
        component="img"
        src="/entry/LoginIlustration.webp"
        sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
      />
    </Box>
  );
}
