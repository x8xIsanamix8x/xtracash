import { Box } from "@mui/material";

type OnboardingVisualProps = Readonly<{
  imageAlt: string;
  imageSrc: string;
}>;

export function OnboardingVisual({ imageAlt, imageSrc }: OnboardingVisualProps) {
  return (
    <Box
      alt={imageAlt}
      component="img"
      src={imageSrc}
      sx={{
        display: "block",
        width: "min(100%, 450px)",
        maxWidth: "100%",
        height: "clamp(230px, 48dvh, 460px)",
        objectFit: "contain",
        objectPosition: "center",
      }}
    />
  );
}
