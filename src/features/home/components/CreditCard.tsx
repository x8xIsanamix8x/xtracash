"use client";

import { useState } from "react";
import { VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

type CreditCardProps = Readonly<{
  status: string;
  available: string;
}>;

export function CreditCard({ status, available }: CreditCardProps) {
  const [isAmountVisible, setIsAmountVisible] = useState(true);

  return (
    <Box
      component="section"
      aria-label="Crédito disponible"
      sx={{
        position: "relative",
        width: "100%",
        height: "auto",
        maxWidth: 480,
        aspectRatio: "1.586 / 1",
        alignSelf: "start",
        display: "flex",
        overflow: "hidden",
        borderRadius: "16px",
        bgcolor: "secondary.main",
        color: "secondary.contrastText",
        p: { xs: 2.5, sm: 3 },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          bgcolor: "secondary.light",
          right: -70,
          top: -80,
          opacity: 0.7,
        }}
      />
      <Stack sx={{ position: "relative", zIndex: 1, flex: 1, justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800 }}>
            XtraCash
          </Typography>
          <Chip
            label={status}
            size="small"
            sx={{ bgcolor: "background.paper", color: "secondary.main", fontWeight: 700 }}
          />
        </Stack>
        <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "space-between" }}>
          <Stack spacing={0.5}>
            <Typography color="secondary.contrastText" variant="body2" sx={{ opacity: 0.78 }}>
              Disponible
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {isAmountVisible ? available : "Bs. ••••••"}
            </Typography>
          </Stack>
          <IconButton
            aria-label={isAmountVisible ? "Ocultar monto disponible" : "Mostrar monto disponible"}
            aria-pressed={!isAmountVisible}
            onClick={() => setIsAmountVisible((current) => !current)}
            sx={{ color: "secondary.contrastText" }}
          >
            {isAmountVisible ? <VisibilityOffRounded /> : <VisibilityRounded />}
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
