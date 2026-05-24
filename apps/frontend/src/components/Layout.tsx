import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Logout, Menu } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import BottomNav from "./BottomNav";
import Brand from "./Brand";
import ModeSwitch from "./ModeSwitch";
import SidebarNav from "./SidebarNav";

const drawerWidth = 280;

const Layout = () => {
  const { user, logout } = useAuth();
  const { mode } = useApp();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Box component="header" sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
          <Brand subtitle="Rifas estilo colombiano en modo demo." />
        </Box>
        <Box component="main" sx={{ flex: 1 }}>
          <Container maxWidth="lg">
            <Outlet />
          </Container>
        </Box>
        <Box component="footer" sx={{ px: { xs: 2, md: 4 }, py: 3, color: "text.secondary" }}>
          <Typography variant="body2">
            Proyecto de aprendizaje. Compra simulada sin pasarela de pagos.
          </Typography>
        </Box>
      </Box>
    );
  }

  const drawerContent = (
    <Stack sx={{ height: "100%", p: 3 }} spacing={3}>
      <Brand subtitle="Rifas colombianas en modo demo." />
      <ModeSwitch />
      <Divider />
      <SidebarNav onNavigate={() => setMobileOpen(false)} />
      <Box sx={{ mt: "auto" }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="subtitle2">{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Paper>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          sx={{ mt: 2 }}
          startIcon={<Logout />}
          onClick={logout}
        >
          Salir
        </Button>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          pb: { xs: 10, md: 0 },
        }}
      >
        <AppBar position="sticky">
          <Toolbar sx={{ gap: 2 }}>
            {!isDesktop && (
              <IconButton color="inherit" onClick={handleDrawerToggle}>
                <Menu />
              </IconButton>
            )}
            <Brand compact subtitle={mode === "sell" ? "Modo vendedor" : "Modo comprador"} />
            <Box sx={{ ml: "auto", display: "flex", gap: 2, alignItems: "center" }}>
              {!isDesktop && <ModeSwitch />}
              <Button variant="text" color="inherit" onClick={logout} startIcon={<Logout />}>
                Salir
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 4 } }}>
          <Container maxWidth="lg">
            <Outlet />
          </Container>
        </Box>
        <Box component="footer" sx={{ px: { xs: 2, md: 4 }, py: 3, color: "text.secondary" }}>
          <Typography variant="body2">
            Proyecto de aprendizaje. Compra simulada sin pasarela de pagos.
          </Typography>
        </Box>
      </Box>

      <BottomNav />
    </Box>
  );
};

export default Layout;
