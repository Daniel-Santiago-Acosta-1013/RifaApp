import * as React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { alpha, createTheme } from "@mui/material/styles";
import type { LinkProps as MuiLinkProps } from "@mui/material/Link";

const LinkBehavior = React.forwardRef<HTMLAnchorElement, Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }>(
  (props, ref) => {
    const { href, ...other } = props;
    return <RouterLink ref={ref} to={href} {...other} />;
  },
);

LinkBehavior.displayName = "LinkBehavior";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#F36B4F",
      dark: "#D9563D",
      light: "#FFB089",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2FB49A",
      dark: "#1F8E7A",
      light: "#8FE2D3",
      contrastText: "#0D1F1B",
    },
    background: {
      default: "#F6F1EA",
      paper: "#FFFCF8",
    },
    text: {
      primary: "#1C1F26",
      secondary: "#6F7682",
    },
    divider: "#E6E1D8",
    success: {
      main: "#2FB49A",
    },
    warning: {
      main: "#F4A14F",
    },
    error: {
      main: "#CC4B4B",
    },
    info: {
      main: "#5B7CFA",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Manrope", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "radial-gradient(circle at top, #FFF7EE 0%, #F6F1EA 40%, #EFE9E0 100%)",
        },
        "#root": {
          minHeight: "100vh",
        },
        a: {
          color: "inherit",
          textDecoration: "none",
        },
      },
    },
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as MuiLinkProps,
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          paddingBlock: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #EFE7DC",
          boxShadow: "0 20px 45px rgba(18, 22, 33, 0.08)",
          borderRadius: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(10px)",
          backgroundColor: alpha("#FFFCF8", 0.82),
          color: "#1C1F26",
          borderBottom: "1px solid #EFE7DC",
        },
      },
      defaultProps: {
        elevation: 0,
        color: "transparent",
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #EFE7DC",
          backgroundColor: "#FFFCF8",
        },
      },
    },
  },
});

export default theme;
