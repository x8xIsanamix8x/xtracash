import Link from "next/link";
import { LockOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

import { BiometricProfileSection } from "@/features/biometric-access";

type SecurityCardProps = Readonly<{
  biometricEnabled?: boolean;
}>;

export function SecurityCard({ biometricEnabled = false }: SecurityCardProps) {
  return (
    <Card component="section" variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Seguridad
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "background.default",
                color: "primary.main",
              }}
            >
              <LockOutlined />
            </Box>
            <Stack spacing={0.5}>
              <Typography component="h3" sx={{ fontWeight: 700 }}>
                Cambiar contraseña
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Recibe un enlace seguro para cambiar tu contraseña.
              </Typography>
            </Stack>
          </Stack>
          <Button
            component={Link}
            fullWidth
            href="/profile/change-password"
            variant="outlined"
          >
            Cambiar contraseña
          </Button>
          {biometricEnabled && (
            <>
              <Divider />
              <BiometricProfileSection />
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
