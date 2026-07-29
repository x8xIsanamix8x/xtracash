import {
  BlockRounded,
  CheckCircleRounded,
  PauseCircleRounded,
} from "@mui/icons-material";
import { Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  creditLineStatusConfig,
  type CreditLineStatus,
} from "../status";

type CreditLineStatusChipProps = Readonly<{
  status: CreditLineStatus;
}>;

const statusIcons = {
  active: CheckCircleRounded,
  blocked: BlockRounded,
  suspended: PauseCircleRounded,
} as const;

export function CreditLineStatusChip({
  status,
}: CreditLineStatusChipProps) {
  const definition = creditLineStatusConfig[status];
  const StatusIcon = statusIcons[status];

  return (
    <Chip
      aria-label={definition.accessibleMessage}
      icon={<StatusIcon aria-hidden="true" />}
      label={definition.label}
      size="small"
      sx={(theme) => ({
        maxWidth: "100%",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: alpha(theme.palette[definition.tone].main, 0.72),
        color: "secondary.main",
        fontWeight: 700,
        "& .MuiChip-icon": {
          color: `${definition.tone}.main`,
        },
      })}
    />
  );
}
