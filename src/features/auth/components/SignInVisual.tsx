import { KeyRounded, PersonRounded } from "@mui/icons-material";
import { Box } from "@mui/material";

export function SignInVisual() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: { xs: "clamp(160px, 28dvh, 240px)", md: "clamp(280px, 34dvh, 320px)" },
        mx: "auto",
        borderRadius: "22px",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        pointerEvents: "none",
        p: { xs: 3, md: 4 },
        "@media (max-height: 700px)": {
          height: "clamp(120px, 22dvh, 150px)",
          p: 2,
        },
        "@media (max-height: 520px)": {
          height: "clamp(120px, 28dvh, 150px)",
          p: 2,
        },
        "@media (max-height: 450px)": {
          display: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "clamp(112px, 38%, 176px)",
          aspectRatio: "1 / 1",
          display: "grid",
          placeItems: "center",
          color: "secondary.main",
        }}
      >
        <PersonRounded sx={{ width: "52%", height: "52%" }} />
        <Box
          sx={{
            position: "absolute",
            right: "2%",
            bottom: "8%",
            width: "34%",
            aspectRatio: "1",
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            border: "4px solid",
            borderColor: "background.paper",
            display: "grid",
            placeItems: "center",
          }}
        >
          <KeyRounded sx={{ width: "58%", height: "58%" }} />
        </Box>
      </Box>
    </Box>
  );
}
