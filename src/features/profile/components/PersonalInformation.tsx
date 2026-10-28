import {
  BadgeOutlined,
  EmailOutlined,
  PersonRounded,
  PhoneOutlined,
} from "@mui/icons-material";
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

import type { ProfileData } from "../types";

type PersonalInformationProps = Readonly<{
  user: ProfileData;
}>;

const fields = [
  { key: "fullName", label: "Nombre", icon: PersonRounded },
  { key: "document", label: "Documento", icon: BadgeOutlined },
  { key: "email", label: "Correo electrónico", icon: EmailOutlined },
  { key: "phone", label: "Teléfono", icon: PhoneOutlined },
] as const;

export function PersonalInformation({ user }: PersonalInformationProps) {
  return (
    <Card component="section" variant="outlined" sx={{ height: "100%", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
        <Stack spacing={2.5}>
          <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Información personal
          </Typography>
          <Box component="dl" sx={{ m: 0 }}>
            {fields.map((field, index) => {
              const FieldIcon = field.icon;

              return (
                <Box key={field.key}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", py: 1.5 }}>
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        bgcolor: "background.default",
                        color: "primary.main",
                      }}
                    >
                      <FieldIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography component="dt" color="text.secondary" variant="body2">
                        {field.label}
                      </Typography>
                      <Typography
                        component="dd"
                        sx={{ m: 0, overflowWrap: "anywhere", fontWeight: 700 }}
                      >
                        {user[field.key]}
                      </Typography>
                    </Box>
                  </Stack>
                  {index < fields.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Para proteger tu cuenta, estos datos no pueden modificarse directamente desde la aplicación.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
