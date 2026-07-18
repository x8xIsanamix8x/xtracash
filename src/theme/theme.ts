import { createTheme } from "@mui/material/styles";

import { themeTokens } from "./tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: themeTokens.color.primary,
    },
    secondary: {
      main: themeTokens.color.brandNavy,
      light: themeTokens.color.darkSurface,
      contrastText: themeTokens.color.onDark,
    },
    background: {
      default: themeTokens.color.background,
      paper: themeTokens.color.paper,
    },
    text: {
      primary: themeTokens.color.text,
      secondary: themeTokens.color.textSecondary,
    },
  },
  shape: themeTokens.shape,
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h3: {
      fontSize: "2rem",
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ ownerState }) => ({
          minHeight: 48,
          textTransform: "none",
          "&:focus-visible": {
            outline: `3px solid ${themeTokens.color.focus}`,
            outlineOffset: 2,
          },
          ...(ownerState.variant === "contained" &&
            ownerState.color === "primary" && {
              "&:hover": {
                backgroundColor: themeTokens.color.primaryHover,
              },
              "&:active": {
                backgroundColor: themeTokens.color.primaryActive,
              },
            }),
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
          "&:focus-visible": {
            outline: `3px solid ${themeTokens.color.focus}`,
            outlineOffset: 2,
          },
        },
      },
    },
  },
});
