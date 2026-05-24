import { Home, Person, Storefront } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLoggedIn = !!user;

  if (!isLoggedIn || !isMobile) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 420,
        zIndex: 1300,
        borderRadius: 999,
        background: "rgba(255, 252, 248, 0.92)",
        backdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(239, 231, 220, 0.8)",
        boxShadow: "0 8px 32px rgba(18, 22, 33, 0.08)",
        overflow: "hidden",
      }}
    >
      <BottomNavigation
        value={location.pathname}
        showLabels
        sx={{
          height: 64,
          backgroundColor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            color: "text.secondary",
            minWidth: 0,
            py: 1,
            borderRadius: 999,
            mx: 0.5,
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              color: "primary.main",
              backgroundColor: "rgba(243, 107, 79, 0.08)",
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.7rem !important",
            fontWeight: 600,
            mt: 0.5,
          },
          "& .MuiSvgIcon-root": {
            fontSize: "1.35rem",
          },
        }}
      >
        <BottomNavigationAction
          label="Inicio"
          icon={<Home />}
          value="/"
          component={Link}
          to="/"
        />
        <BottomNavigationAction
          label="Mis rifas"
          icon={<Storefront />}
          value="/sell/raffles"
          component={Link}
          to="/sell/raffles"
        />
        <BottomNavigationAction
          label="Perfil"
          icon={<Person />}
          value="/profile"
          component={Link}
          to="/profile"
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
