import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Close,
  Home,
  Login,
  Logout,
  Menu,
  Person,
  PersonAdd,
  Storefront,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import Brand from "./Brand";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Inicio", href: "/", icon: <Home /> },
  { label: "Perfil", href: "/profile", icon: <Person />, auth: true },
  { label: "Mis rifas", href: "/sell/raffles", icon: <Storefront />, auth: true },
];

const publicItems = [
  { label: "Iniciar sesion", href: "/login", icon: <Login /> },
  { label: "Registrarse", href: "/register", icon: <PersonAdd /> },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const canUseDrawerNavigation = !isMobile;
  const showMenuButton = canUseDrawerNavigation && (location.pathname !== "/" || isLoggedIn);

  useEffect(() => {
    if (isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [drawerOpen, isMobile]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDrawerOpen(false);
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.auth && !isLoggedIn) return false;
    return true;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="sticky">
        <Container maxWidth="md">
          <Toolbar disableGutters sx={{ minHeight: 64 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
              {showMenuButton && (
                <IconButton
                  aria-label="Abrir menu"
                  edge="start"
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    color: "inherit",
                    backgroundColor: "rgba(243, 107, 79, 0.08)",
                    borderRadius: 2.5,
                    width: 40,
                    height: 40,
                    "&:hover": {
                      backgroundColor: "rgba(243, 107, 79, 0.15)",
                    },
                  }}
                >
                  <Menu />
                </IconButton>
              )}
              <Brand compact />
            </Stack>
            {isLoggedIn ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={600} sx={{ display: { xs: "none", sm: "block" } }}>
                  {user?.name}
                </Typography>
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "text.secondary",
                    backgroundColor: "rgba(204, 75, 75, 0.08)",
                    borderRadius: 2.5,
                    width: 40,
                    height: 40,
                    "&:hover": {
                      backgroundColor: "rgba(204, 75, 75, 0.15)",
                      color: "error.main",
                    },
                  }}
                >
                  <Logout />
                </IconButton>
              </Stack>
            ) : (
              location.pathname !== "/" && (
                <Stack direction="row" spacing={1}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      color: "primary.main",
                      cursor: "pointer",
                      display: { xs: "none", sm: "block" },
                    }}
                    component="a"
                    href="/login"
                  >
                    Entrar
                  </Typography>
                </Stack>
              )
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {canUseDrawerNavigation && (
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, p: 2 }}>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Brand />
                <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ color: "text.secondary" }}>
                  <Close />
                </IconButton>
              </Stack>

              <List disablePadding>
                {filteredNavItems.map((item) => (
                  <ListItemButton
                    key={item.href}
                    component="a"
                    href={item.href}
                    selected={location.pathname === item.href}
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      borderRadius: 3,
                      mb: 0.5,
                      transition: "all 0.2s ease",
                      "&.Mui-selected": {
                        backgroundColor: "rgba(243, 107, 79, 0.08)",
                        color: "primary.main",
                        "&:hover": {
                          backgroundColor: "rgba(243, 107, 79, 0.12)",
                        },
                        "& .MuiListItemIcon-root": {
                          color: "primary.main",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "rgba(28, 31, 38, 0.04)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "text.secondary", minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                ))}
              </List>

              {!isLoggedIn && (
                <>
                  <Box sx={{ height: 1, backgroundColor: "divider" }} />
                  <List disablePadding>
                    {publicItems.map((item) => (
                      <ListItemButton
                        key={item.href}
                        component="a"
                        href={item.href}
                        selected={location.pathname === item.href}
                        onClick={() => setDrawerOpen(false)}
                        sx={{
                          borderRadius: 3,
                          mb: 0.5,
                          transition: "all 0.2s ease",
                          "&.Mui-selected": {
                            backgroundColor: "rgba(243, 107, 79, 0.08)",
                            color: "primary.main",
                            "& .MuiListItemIcon-root": {
                              color: "primary.main",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "rgba(28, 31, 38, 0.04)",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "text.secondary", minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                      </ListItemButton>
                    ))}
                  </List>
                </>
              )}

              {isLoggedIn && (
                <>
                  <Box sx={{ height: 1, backgroundColor: "divider" }} />
                  <ListItemButton
                    onClick={handleLogout}
                    sx={{
                      borderRadius: 3,
                      color: "error.main",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(204, 75, 75, 0.08)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "error.main", minWidth: 40 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Cerrar sesion" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </>
              )}
            </Stack>
          </Box>
        </Drawer>
      )}

      <Box sx={{ flex: 1, pb: isMobile && isLoggedIn ? 8 : 0 }}>
        <Outlet />
      </Box>

      <BottomNav />
    </Box>
  );
};

export default Layout;
