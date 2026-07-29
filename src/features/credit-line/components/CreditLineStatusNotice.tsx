import { BlockRounded, PauseCircleRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  creditLineStatusConfig,
  type CreditLineStatus,
} from "../status";

type CreditLineStatusNoticeProps = Readonly<{
  status: CreditLineStatus;
  onHelp: () => void;
  onPayDebt: () => void;
}>;

const noticeIcons = {
  blocked: BlockRounded,
  suspended: PauseCircleRounded,
} as const;

export function CreditLineStatusNotice({
  status,
  onHelp,
  onPayDebt,
}: CreditLineStatusNoticeProps) {
  const definition = creditLineStatusConfig[status];

  if (status === "active" || definition.notice === null) {
    return null;
  }

  const NoticeIcon = noticeIcons[status];
  const titleId = `credit-line-${status}-title`;
  const descriptionId = `credit-line-${status}-description`;

  return (
    <Card
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      component="section"
      variant="outlined"
      sx={{
        borderLeft: "4px solid",
        borderLeftColor: `${definition.tone}.main`,
        bgcolor: "background.paper",
        boxShadow: "none",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ minWidth: 0, flex: 1, alignItems: "flex-start" }}
          >
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: alpha(theme.palette[definition.tone].main, 0.1),
                color: `${definition.tone}.main`,
              })}
            >
              <NoticeIcon />
            </Box>
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <Typography
                component="h2"
                id={titleId}
                variant="h6"
                sx={{ color: "secondary.main", fontWeight: 700 }}
              >
                {definition.notice.title}
              </Typography>
              <Typography color="text.secondary" id={descriptionId} variant="body2">
                {definition.notice.description}
              </Typography>
            </Stack>
          </Stack>
          <Button
            onClick={status === "blocked" ? onPayDebt : onHelp}
            sx={{
              width: { xs: "100%", sm: "auto" },
              flexShrink: 0,
            }}
            type="button"
            variant="outlined"
          >
            {definition.notice.actionLabel}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
