import type { ReactNode, Ref } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { PaymentReportScreenLayout } from "./PaymentReportScreenLayout";

type PaymentReportStepLayoutProps = Readonly<{
  actions?: ReactNode;
  children?: ReactNode;
  description?: string;
  title: string;
  titleId: string;
  titleRef: Ref<HTMLHeadingElement>;
}>;

export function PaymentReportStepLayout({
  actions,
  children,
  description,
  title,
  titleId,
  titleRef,
}: PaymentReportStepLayoutProps) {
  return (
    <PaymentReportScreenLayout actions={actions} labelledBy={titleId}>
      <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <Stack spacing={1}>
          <Typography
            component="h1"
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            variant="h4"
            sx={{ color: "secondary.main", fontWeight: 700 }}
          >
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>

        {children && <Box sx={{ pt: 3 }}>{children}</Box>}
      </Box>
    </PaymentReportScreenLayout>
  );
}
