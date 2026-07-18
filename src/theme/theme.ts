import { createTheme } from "@mui/material/styles";

import { themeTokens } from "./tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: themeTokens.color.primary,
    },
    background: {
      default: themeTokens.color.background,
      paper: themeTokens.color.paper,
    },
    text: {
      primary: themeTokens.color.text,
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
        root: {
          textTransform: "none",
        },
      },
    },
  },
});
