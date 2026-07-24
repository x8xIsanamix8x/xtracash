import { Avatar, Box, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

import type { ProfileData } from "../types";

type ProfileSummaryProps = Readonly<{
  user: ProfileData;
}>;

export function ProfileSummary({ user }: ProfileSummaryProps) {
  return (
    <Card
      component="section"
      variant="outlined"
      sx={{
        position: "relative",
        minHeight: 220,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        boxShadow: "none",
      }}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
        })}
      />
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "absolute",
          top: -72,
          right: -44,
          width: 180,
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        })}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          bottom: 28,
          left: "12%",
          width: 12,
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: themeTokens.color.accent,
        }}
      />
      <Stack
        spacing={1.5}
        sx={{
          position: "relative",
          zIndex: 1,
          alignItems: "center",
          p: 3,
          textAlign: "center",
        }}
      >
        <Avatar
          sx={{
            width: 88,
            height: 88,
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
            fontSize: "1.75rem",
            fontWeight: 700,
          }}
        >
          {user.initials}
        </Avatar>
        <Typography component="h2" variant="h5" sx={{ color: "secondary.main", fontWeight: 700 }}>
          {user.fullName}
        </Typography>
      </Stack>
    </Card>
  );
}
