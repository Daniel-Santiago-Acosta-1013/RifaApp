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
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Manrope", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.15,
    },
    h3: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.015em",
      lineHeight: 1.25,
    },
    h5: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h6: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      lineHeight: 1.35,
    },
    subtitle1: {
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle2: {
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    overline: {
      fontWeight: 700,
      letterSpacing: "0.14em",
    },
  },
  transitions: {
    duration: {
      short: 150,
      standard: 250,
      complex: 375,
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "radial-gradient(ellipse at 20% 0%, #FFF7EE 0%, #F6F1EA 50%, #EFE9E0 100%)",
          minHeight: "100vh",
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
          borderRadius: 14,
          paddingInline: 22,
          paddingBlock: 10,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 8px 24px rgba(243, 107, 79, 0.18)",
          },
        },
        contained: {
          boxShadow: "0 4px 16px rgba(243, 107, 79, 0.22)",
          "&:hover": {
            boxShadow: "0 8px 28px rgba(243, 107, 79, 0.32)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        rounded: {
          borderRadius: 16,
        },
        outlined: {
          borderColor: "#EFE7DC",
          borderWidth: 1.5,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #EFE7DC",
          boxShadow: "0 8px 32px rgba(18, 22, 33, 0.06)",
          borderRadius: 16,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 48px rgba(18, 22, 33, 0.1)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          height: 28,
          fontSize: "0.8rem",
        },
        filled: {
          backdropFilter: "blur(4px)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(16px) saturate(180%)",
          backgroundColor: alpha("#FFFCF8", 0.88),
          color: "#1C1F26",
          borderBottom: "1px solid rgba(239, 231, 220, 0.8)",
          boxShadow: "0 1px 3px rgba(18, 22, 33, 0.04)",
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
          borderRight: "1px solid rgba(239, 231, 220, 0.8)",
          backgroundColor: "#FFFCF8",
          boxShadow: "4px 0 24px rgba(18, 22, 33, 0.04)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 14,
            transition: "all 0.2s ease",
            "& fieldset": {
              borderWidth: 1.5,
              borderColor: "#E6E1D8",
              transition: "border-color 0.2s ease",
            },
            "&:hover fieldset": {
              borderColor: "#D0C8BC",
            },
            "&.Mui-focused fieldset": {
              borderWidth: 2,
              borderColor: "primary.main",
            },
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          transition: "all 0.2s ease",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          alignItems: "center",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: "rgba(28, 31, 38, 0.06)",
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: "0 32px 64px rgba(18, 22, 33, 0.12)",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 64,
          padding: "4px 8px",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: "all 0.2s ease",
          "&.Mui-selected": {
            paddingTop: 8,
          },
        },
      },
    },
  },
});

export default theme;
