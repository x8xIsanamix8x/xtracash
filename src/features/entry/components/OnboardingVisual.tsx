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
        width: "min(100%, 562px)",
        maxWidth: "100%",
        height: "min(100%, clamp(240px, 48dvh, 500px))",
        maxHeight: "100%",
        objectFit: "contain",
        objectPosition: "center",
      }}
    />
  );
}
