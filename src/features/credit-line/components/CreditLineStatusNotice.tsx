import {
  BlockRounded,
  LockClockRounded,
  ScheduleRounded,
} from "@mui/icons-material";
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
  onReportPayment: () => void;
}>;

const noticeIcons = {
  MORA_NIVEL_1: ScheduleRounded,
  CONGELADA_NIVEL_2: LockClockRounded,
  BLOQUEADA_TERCER_CORTE: BlockRounded,
  BLOQUEADA_RETIRO: BlockRounded,
} as const;

export function CreditLineStatusNotice({
  status,
  onReportPayment,
}: CreditLineStatusNoticeProps) {
  const definition = creditLineStatusConfig[status];

  if (status === "ACTIVA" || definition.notice === null) {
    return null;
  }

  const NoticeIcon = noticeIcons[status];
  const statusKey = status.toLowerCase();
  const titleId = `credit-line-${statusKey}-title`;
  const descriptionId = `credit-line-${statusKey}-description`;

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
          p: { xs: 1.5, sm: 2 },
          "&:last-child": { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
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
                width: 36,
                height: 36,
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
                variant="subtitle1"
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
            onClick={onReportPayment}
            sx={{
              width: "auto",
              alignSelf: { xs: "flex-end", sm: "center" },
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
