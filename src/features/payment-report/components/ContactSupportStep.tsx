import type { Ref } from "react";
import { SupportAgentRounded } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PaymentReportScreenLayout } from "./PaymentReportScreenLayout";

type ContactSupportStepProps = Readonly<{
  titleRef: Ref<HTMLHeadingElement>;
  onBackHome: () => void;
}>;

export function ContactSupportStep({
  titleRef,
  onBackHome,
}: ContactSupportStepProps) {
  return (
    <PaymentReportScreenLayout
      actions={(
        <Button fullWidth onClick={onBackHome} type="button" variant="contained">
          Volver al inicio
        </Button>
      )}
      labelledBy="payment-report-contact-title"
    >
      <Stack
        spacing={2}
        sx={{
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 2, sm: 4 },
          textAlign: "center",
        }}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            width: 72,
            height: 72,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          })}
        >
          <SupportAgentRounded sx={{ width: 38, height: 38 }} />
        </Box>
        <Typography
          component="h1"
          id="payment-report-contact-title"
          ref={titleRef}
          tabIndex={-1}
          variant="h4"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          Necesitamos ayudarte
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          Si realizaste el pago usando datos distintos a los mostrados, no lo
          reportes todavía. Comunícate con nuestro equipo de soporte para revisar
          la operación.
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Canal de soporte: Próximamente
        </Typography>
      </Stack>
    </PaymentReportScreenLayout>
  );
}
