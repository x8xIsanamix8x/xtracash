import Link from "next/link";
import { Button, Stack, Typography } from "@mui/material";

type ChangePasswordSuccessProps = Readonly<{
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}>;

export function ChangePasswordSuccess({ titleRef }: ChangePasswordSuccessProps) {
  return (
    <Stack
      aria-live="polite"
      role="status"
      spacing={2}
      sx={{ justifyContent: "center", p: { xs: 3, lg: 5 }, textAlign: { xs: "center", lg: "left" } }}
    >
      <Typography
        component="h1"
        ref={titleRef}
        tabIndex={-1}
        variant="h4"
        sx={{ color: "secondary.main", fontWeight: 700 }}
      >
        Contraseña actualizada
      </Typography>
      <Button component={Link} fullWidth href="/profile" variant="contained">
        Volver al perfil
      </Button>
    </Stack>
  );
}
