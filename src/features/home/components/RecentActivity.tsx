import { CheckCircleOutlineRounded, PaymentsOutlined, TuneRounded } from "@mui/icons-material";
import { Avatar, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from "@mui/material";

import type { RecentActivityItem } from "../types";

type RecentActivityProps = Readonly<{
  items: readonly RecentActivityItem[];
}>;

const activityIcons = {
  payment: PaymentsOutlined,
  approval: CheckCircleOutlineRounded,
  adjustment: TuneRounded,
} as const;

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card
      component="section"
      variant="outlined"
      sx={{ borderRadius: { xs: "16px", md: 3 } }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
        <Stack spacing={0.5}>
          <Typography component="h2" variant="h6" sx={{ color: "secondary.main", fontWeight: 700 }}>
            Movimientos recientes
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Últimos movimientos de tu crédito
          </Typography>
        </Stack>
        <List disablePadding>
          {items.map((item) => {
            const ActivityIcon = activityIcons[item.kind];

            return (
              <ListItem
                disableGutters
                key={item.id}
                divider={item.id !== items.at(-1)?.id}
                sx={{ minHeight: { xs: 68, md: "auto" }, py: { xs: 0.75, md: 1 } }}
              >
                <ListItemAvatar sx={{ minWidth: { xs: 44, md: 56 } }}>
                  <Avatar
                    sx={{
                      width: { xs: 36, md: 40 },
                      height: { xs: 36, md: 40 },
                      bgcolor: "background.default",
                      color: "secondary.main",
                    }}
                  >
                    <ActivityIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.title}
                  secondary={item.date}
                  sx={{ minWidth: 0, mr: 1 }}
                  slotProps={{
                    primary: { noWrap: true },
                    secondary: { noWrap: true },
                  }}
                />
                <Typography sx={{ flexShrink: 0, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {item.amount}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
