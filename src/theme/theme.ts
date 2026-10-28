import { alpha, createTheme, darken } from "@mui/material/styles";

import { themeTokens } from "./tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: themeTokens.color.primary,
      contrastText: themeTokens.color.onDark,
    },
    secondary: {
      main: themeTokens.color.brandDeep,
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
            outline: `3px solid ${themeTokens.color.primary}`,
            outlineOffset: 2,
          },
          "&.Mui-disabled": {
            color: alpha(themeTokens.color.text, 0.38),
          },
          ...(ownerState.variant === "contained" &&
            ownerState.color === "primary" && {
              "&:hover": {
                backgroundColor: darken(themeTokens.color.primary, 0.12),
              },
              "&:active": {
                backgroundColor: darken(themeTokens.color.primary, 0.2),
              },
              "&.Mui-disabled": {
                backgroundColor: alpha(themeTokens.color.text, 0.12),
              },
            }),
          ...(ownerState.variant === "outlined" &&
            ownerState.color === "primary" && {
              "&.Mui-disabled": {
                borderColor: alpha(themeTokens.color.text, 0.12),
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
          "&:hover": {
            backgroundColor: alpha(themeTokens.color.primary, 0.08),
          },
          "&:active": {
            backgroundColor: alpha(themeTokens.color.primary, 0.16),
          },
          "&:focus-visible": {
            outline: `3px solid ${themeTokens.color.primary}`,
            outlineOffset: 2,
          },
          "&.Mui-disabled": {
            color: alpha(themeTokens.color.text, 0.38),
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: themeTokens.color.textSecondary,
          "&:hover": {
            backgroundColor: alpha(themeTokens.color.primary, 0.08),
          },
          "&:active": {
            backgroundColor: alpha(themeTokens.color.primary, 0.16),
          },
          "&:focus-visible": {
            outline: `3px solid ${themeTokens.color.primary}`,
            outlineOffset: -3,
          },
          "&.Mui-selected": {
            color: themeTokens.color.primary,
          },
          "&.Mui-disabled": {
            color: alpha(themeTokens.color.text, 0.38),
          },
        },
      },
    },
  },
});
