import { Button, Stack, Typography } from "@mui/material";

type SecurityFlowSuccessProps = Readonly<{
  actionLabel: string;
  message: string;
  onAction: () => void;
  title: string;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}>;

export function SecurityFlowSuccess({
  actionLabel,
  message,
  onAction,
  title,
  titleRef,
}: SecurityFlowSuccessProps) {
  return (
    <Stack
      aria-live="polite"
      role="status"
      spacing={2}
      sx={{ justifyContent: "center", textAlign: "center" }}
    >
      <Typography
        component="h1"
        ref={titleRef}
        tabIndex={-1}
        variant="h4"
        sx={{ color: "secondary.main", fontWeight: 700 }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary">{message}</Typography>
      <Button fullWidth onClick={onAction} variant="contained">
        {actionLabel}
      </Button>
    </Stack>
  );
}
