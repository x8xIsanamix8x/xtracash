import type { ReactNode } from "react";
import { Card, CardContent } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { homeVisualTokens } from "@/features/home/homeVisualTokens";

type PrimaryFinancialCardProps = Readonly<{
  children: ReactNode;
  labelledBy?: string;
}>;

export function PrimaryFinancialCard({
  children,
  labelledBy,
}: PrimaryFinancialCardProps) {
  return (
    <Card
      aria-labelledby={labelledBy}
      component="section"
      elevation={0}
      sx={{
        borderRadius: `${homeVisualTokens.radius.balance}px`,
        bgcolor: homeVisualTokens.color.availableCard,
        color: homeVisualTokens.color.white,
        boxShadow: `0 12px 32px ${alpha(homeVisualTokens.color.navy, 0.12)}`,
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2.5, sm: 3 },
          "&:last-child": { pb: { xs: 2.5, sm: 3 } },
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
