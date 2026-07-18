import {
  CheckCircleOutlineRounded,
  ChecklistRounded,
  DescriptionOutlined,
  PhoneIphoneRounded,
  SecurityRounded,
  TimelineRounded,
  VerifiedRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";

import type { OnboardingVisualKey } from "../data/onboardingSteps";

type OnboardingVisualProps = Readonly<{
  visualKey: OnboardingVisualKey;
  imageAlt: string;
}>;

const visualIcons = {
  "digital-request": [PhoneIphoneRounded, DescriptionOutlined],
  requirements: [ChecklistRounded, CheckCircleOutlineRounded],
  tracking: [TimelineRounded, CheckCircleOutlineRounded],
  verification: [SecurityRounded, VerifiedRounded],
} as const;

export function OnboardingVisual({ visualKey, imageAlt }: OnboardingVisualProps) {
  const [PrimaryIcon, SecondaryIcon] = visualIcons[visualKey];

  return (
    <Box
      aria-label={imageAlt}
      role="img"
      sx={{
        position: "relative",
        width: "clamp(96px, 28dvh, 260px)",
        aspectRatio: "1",
        borderRadius: "50%",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        display: "grid",
        placeItems: "center",
        color: "secondary.main",
      }}
    >
      <PrimaryIcon aria-hidden="true" sx={{ fontSize: "48%" }} />
      <Box
        sx={{
          position: "absolute",
          right: "4%",
          bottom: "10%",
          width: "34%",
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "grid",
          placeItems: "center",
          border: "4px solid",
          borderColor: "background.default",
        }}
      >
        <SecondaryIcon aria-hidden="true" sx={{ fontSize: "60%" }} />
      </Box>
    </Box>
  );
}
