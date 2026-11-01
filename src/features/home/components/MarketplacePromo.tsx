import Link from "next/link";
import { ArrowForwardRounded, ReceiptLongRounded, StorefrontRounded } from "@mui/icons-material";
import { Box, Button, Card, Stack, Typography } from "@mui/material";

import { homeVisualTokens } from "../homeVisualTokens";

export function MarketplacePromo() {
  return (
    <Card
      component="section"
      aria-labelledby="marketplace-promo-title"
      sx={{
        overflow: "hidden",
        borderRadius: 3,
        background: `linear-gradient(125deg, ${homeVisualTokens.color.availableCard} 0%, ${homeVisualTokens.color.violet} 100%)`,
        color: homeVisualTokens.color.white,
        boxShadow: "0 10px 26px rgba(37, 37, 154, 0.18)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { xs: "stretch", sm: "center" }, p: { xs: 2.25, sm: 2.5 } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.16)",
            }}
          >
            <StorefrontRounded />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="marketplace-promo-title" component="h2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Impulsa Place
            </Typography>
            <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.88)", fontSize: "0.875rem", lineHeight: 1.4 }}>
              Explora productos o consulta tus compras.
            </Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            component={Link}
            href="/marketplace/compras"
            startIcon={<ReceiptLongRounded />}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: "rgba(255,255,255,0.72)",
              color: homeVisualTokens.color.white,
              fontWeight: 700,
              "&:hover": { borderColor: homeVisualTokens.color.white, bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            Mis compras
          </Button>
          <Button
            component={Link}
            href="/marketplace"
            endIcon={<ArrowForwardRounded />}
            variant="contained"
            sx={{
              borderRadius: 2,
              bgcolor: homeVisualTokens.color.white,
              color: homeVisualTokens.color.navy,
              fontWeight: 700,
              "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
            }}
          >
            Explorar
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
