import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowBackRounded } from "@mui/icons-material";
import { Box, Container, IconButton, Paper, Stack, Typography } from "@mui/material";

import { themeTokens } from "@/theme/tokens";

type SecurityFlowShellProps = Readonly<{
  backHref: string;
  backLabel: string;
  children: ReactNode;
  contentCentered?: boolean;
  minCardHeight?: number;
  visual: ReactNode;
}>;

export function SecurityFlowShell({
  backHref,
  backLabel,
  children,
  contentCentered = false,
  minCardHeight = 520,
  visual,
}: SecurityFlowShellProps) {
  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Container
        maxWidth={false}
        sx={{
          width: "100%",
          maxWidth: 1120,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          pt: "calc(16px + env(safe-area-inset-top))",
          pr: "calc(16px + env(safe-area-inset-right))",
          pb: "calc(16px + env(safe-area-inset-bottom))",
          pl: "calc(16px + env(safe-area-inset-left))",
        }}
      >
        <Stack
          component="header"
          direction="row"
          sx={{ minHeight: 48, alignItems: "center", justifyContent: "space-between" }}
        >
          <IconButton
            aria-label={backLabel}
            component={Link}
            href={backHref}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography sx={{ color: themeTokens.color.brandLogo, fontWeight: 800 }}>
            Impúlsate Móvil
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            py: { xs: 2, sm: 4 },
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              flex: "1 0 auto",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 38fr) minmax(0, 62fr)" },
              gridTemplateRows: { xs: "auto minmax(min-content, 1fr)", lg: "minmax(min-content, 1fr)" },
              minHeight: { sm: minCardHeight, lg: minCardHeight },
              my: { xs: 0, sm: "auto" },
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                minWidth: 0,
                overflow: "hidden",
                borderBottom: { xs: "1px solid", lg: 0 },
                borderRight: { xs: 0, lg: "1px solid" },
                borderColor: "divider",
              }}
            >
              {visual}
            </Box>
            <Box
              sx={{
                display: "flex",
                width: "100%",
                maxWidth: { xs: 680, lg: "none" },
                minWidth: 0,
                mx: "auto",
                flexDirection: "column",
                justifyContent: contentCentered ? "center" : "flex-start",
                p: { xs: 2, sm: 3, lg: 4 },
              }}
            >
              {children}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
