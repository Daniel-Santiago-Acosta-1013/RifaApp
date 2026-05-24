import { Celebration, Email, Logout, Person, Storefront } from "@mui/icons-material";
import { Box, Button, Chip, Container, Paper, Stack, Typography } from "@mui/material";

import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  if (!isLoggedIn || !user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, rgba(243,107,79,0.1), rgba(255,176,137,0.2))",
            color: "primary.main",
            mx: "auto",
            mb: 2,
          }}
        >
          <Person sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          No has iniciado sesion
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Inicia sesion para ver tu perfil.
        </Typography>
        <Button variant="contained" size="large" href="/login" sx={{ borderRadius: 999, px: 4 }}>
          Iniciar sesion
        </Button>
      </Container>
    );
  }

  return (
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <PageHeader title="Tu perfil" subtitle="Administra tu cuenta y preferencias." />

          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,248,240,0.95))",
              border: "1px solid rgba(239,231,220,0.8)",
            }}
          >
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #F36B4F, #FFB089)",
                  color: "#fff",
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  boxShadow: "0 16px 40px rgba(243,107,79,0.25)",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Box>

              <Stack spacing={1} alignItems="center">
                <Typography variant="h4">{user.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Email fontSize="small" sx={{ color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Stack>
                <Chip
                  label="Usuario"
                  size="small"
                  sx={{
                    mt: 0.5,
                    backgroundColor: "rgba(47,180,154,0.1)",
                    color: "secondary.main",
                    fontWeight: 700,
                    border: "1px solid rgba(47,180,154,0.25)",
                  }}
                />
              </Stack>

              <Stack spacing={2} width="100%" maxWidth={320}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(231,222,210,0.6)",
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      background: "linear-gradient(135deg, rgba(47,180,154,0.12), rgba(143,226,211,0.2))",
                      color: "secondary.main",
                    }}
                  >
                    <Celebration />
                  </Box>
                  <Box>
                    <Typography variant="h6">12</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rifas participadas
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(231,222,210,0.6)",
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      background: "linear-gradient(135deg, rgba(243,107,79,0.12), rgba(255,176,137,0.2))",
                      color: "primary.main",
                    }}
                  >
                    <Storefront />
                  </Box>
                  <Box>
                    <Typography variant="h6">5</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rifas creadas
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={logout}
                size="large"
                sx={{ borderRadius: 999, px: 4 }}
              >
                Cerrar sesion
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default Profile;
