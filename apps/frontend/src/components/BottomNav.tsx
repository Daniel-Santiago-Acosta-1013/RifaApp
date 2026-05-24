import { NavLink, useLocation } from "react-router-dom";
import {
  AccountBalanceWallet,
  AddCircle,
  Inventory2,
  Person,
  ShoppingBag,
  SpaceDashboard,
  TravelExplore,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, useTheme } from "@mui/material";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const BottomNav = () => {
  const { mode } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  if (!user || isDesktop) {
    return null;
  }

  const items =
    mode === "sell"
      ? [
          { to: "/", label: "Panel", icon: <SpaceDashboard /> },
          { to: "/sell/raffles", label: "Mis rifas", icon: <Inventory2 /> },
          { to: "/create", label: "Crear", icon: <AddCircle /> },
          { to: "/profile", label: "Perfil", icon: <Person /> },
        ]
      : [
          { to: "/", label: "Explorar", icon: <TravelExplore /> },
          { to: "/purchases", label: "Mis compras", icon: <ShoppingBag /> },
          { to: "/wallet", label: "Saldo", icon: <AccountBalanceWallet /> },
          { to: "/profile", label: "Perfil", icon: <Person /> },
        ];

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        borderRadius: 999,
        zIndex: theme.zIndex.appBar - 1,
      }}
    >
      <BottomNavigation
        value={location.pathname}
        showLabels
        sx={{
          borderRadius: 999,
          bgcolor: "background.paper",
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.to}
            label={item.label}
            icon={item.icon}
            value={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              "&.Mui-selected": {
                color: "primary.main",
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
