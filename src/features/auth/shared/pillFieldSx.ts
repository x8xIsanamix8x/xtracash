import type { Theme } from "@mui/material/styles";

import { themeTokens } from "@/theme/tokens";

// Rounded field from the pre-login Figma, applied to TextFields with variant="filled".
export const pillFieldSx = (background = "#FFFFFF") => (theme: Theme) => ({
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  "& .MuiFilledInput-root": {
    minHeight: 50,
    borderRadius: "999px",
    bgcolor: background,
    "&::before, &::after": { display: "none" },
    "&:hover, &.Mui-focused, &.Mui-disabled": { bgcolor: background },
    "&.Mui-focused": { boxShadow: `inset 0 0 0 2px ${themeTokens.color.preLoginPrimary}` },
    "&.Mui-error": { boxShadow: `inset 0 0 0 2px ${theme.palette.error.main}` },
    "&.MuiInputBase-adornedEnd": { pr: 1 },
  },
  "& .MuiFilledInput-input": {
    pt: "23px",
    pb: "7px",
    px: "20px",
    fontSize: "0.875rem",
    lineHeight: "1.4375em",
    color: themeTokens.color.preLoginNavy,
    "&:-webkit-autofill": { borderRadius: "999px" },
  },
  "& .MuiInputLabel-filled": {
    maxWidth: "calc(100% - 40px)",
    color: themeTokens.color.preLoginMuted,
    fontSize: "0.875rem",
    transform: "translate(20px, 15px) scale(1)",
    "&.MuiInputLabel-shrink": { transform: "translate(20px, 6px) scale(0.8)" },
    "&.Mui-focused": { color: themeTokens.color.preLoginPrimary },
    "&.Mui-error": { color: theme.palette.error.main },
  },
  "& .MuiFormHelperText-root": { mx: "20px" },
}) as const;
