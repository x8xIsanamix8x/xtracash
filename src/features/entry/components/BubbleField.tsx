import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

const bounceWide = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(68vw, 16dvh, 0); }
  50% { transform: translate3d(44vw, 72dvh, 0); }
  75% { transform: translate3d(-4vw, 48dvh, 0); }
`;

const bounceTall = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  30% { transform: translate3d(-54vw, 28dvh, 0); }
  60% { transform: translate3d(-28vw, 70dvh, 0); }
  82% { transform: translate3d(8vw, 42dvh, 0); }
`;

const bounceCompact = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  35% { transform: translate3d(34vw, -26dvh, 0); }
  70% { transform: translate3d(-20vw, 30dvh, 0); }
`;

const bubbles = [
  { size: 72, top: "10%", left: "8%", color: themeTokens.color.accent, animation: bounceWide, duration: "9s", delay: "-2s" },
  { size: 42, top: "16%", left: "62%", color: themeTokens.color.brandNavy, animation: bounceTall, duration: "11s", delay: "-6s" },
  { size: 28, top: "48%", left: "18%", color: themeTokens.color.primary, animation: bounceCompact, duration: "8s", delay: "-4s" },
  { size: 56, top: "58%", left: "68%", color: themeTokens.color.accent, animation: bounceWide, duration: "12s", delay: "-8s" },
  { size: 34, top: "76%", left: "36%", color: themeTokens.color.brandNavy, animation: bounceCompact, duration: "10s", delay: "-1s" },
  { size: 20, top: "34%", left: "44%", color: themeTokens.color.primary, animation: bounceTall, duration: "13s", delay: "-9s" },
] as const;

type BubbleFieldProps = Readonly<{
  variant?: "light" | "dark";
}>;

export function BubbleField({ variant = "light" }: BubbleFieldProps) {
  const isDark = variant === "dark";

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {bubbles.map((bubble, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            top: bubble.top,
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            borderRadius: "50%",
            bgcolor: isDark
              ? index % 3 === 0
                ? themeTokens.color.accent
                : themeTokens.color.onDark
              : bubble.color,
            opacity: isDark ? (index % 2 === 0 ? 0.09 : 0.05) : index % 2 === 0 ? 0.1 : 0.07,
            animation: `${bubble.animation} ${bubble.duration} ease-in-out ${bubble.delay} infinite`,
            willChange: "transform",
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
              willChange: "auto",
            },
          }}
        />
      ))}
    </Box>
  );
}
