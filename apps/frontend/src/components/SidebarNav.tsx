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
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { mode } = useApp();
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const items =
    mode === "sell"
      ? [
          { to: "/", label: "Panel vendedor", icon: <SpaceDashboard /> },
          { to: "/sell/raffles", label: "Mis rifas", icon: <Inventory2 /> },
          { to: "/create", label: "Crear rifa", icon: <AddCircle /> },
          { to: "/profile", label: "Perfil", icon: <Person /> },
        ]
      : [
          { to: "/", label: "Explorar rifas", icon: <TravelExplore /> },
          { to: "/purchases", label: "Mis compras", icon: <ShoppingBag /> },
          { to: "/wallet", label: "Saldo demo", icon: <AccountBalanceWallet /> },
          { to: "/profile", label: "Perfil", icon: <Person /> },
        ];

  return (
    <List aria-label="Secciones" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {items.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <ListItem disablePadding key={item.to}>
            <ListItemButton
              component={NavLink}
              to={item.to}
              onClick={onNavigate}
              selected={isActive}
              sx={{
                borderRadius: 2.5,
                "&.Mui-selected": {
                  bgcolor: "rgba(243, 107, 79, 0.12)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default SidebarNav;
