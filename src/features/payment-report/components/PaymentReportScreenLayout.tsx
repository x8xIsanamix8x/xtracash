import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";

type PaymentReportScreenLayoutProps = Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  labelledBy: string;
}>;

export function PaymentReportScreenLayout({
  actions,
  children,
  labelledBy,
}: PaymentReportScreenLayoutProps) {
  return (
    <Box
      component="section"
      aria-labelledby={labelledBy}
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          px: { xs: 2, sm: 3 },
          pt: { xs: 3, sm: 4 },
          pb: actions ? 2 : "calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </Box>

      {actions && (
        <Stack
          component="footer"
          spacing={1.25}
          sx={{
            flexShrink: 0,
            mt: "auto",
            px: { xs: 2, sm: 3 },
            pt: 1.5,
            pb: "calc(24px + env(safe-area-inset-bottom))",
            bgcolor: "background.default",
          }}
        >
          {actions}
        </Stack>
      )}
    </Box>
  );
}
