import { Button, Divider, Paper, Stack, Typography } from "@mui/material";

import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import ModeSwitch from "../components/ModeSwitch";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";
import { getParticipantId } from "../utils/participants";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { balance } = useApp();

  if (!user) {
    return (
      <Onboarding
        title="Tu perfil esta listo"
        subtitle="Crea una cuenta para personalizar tu experiencia."
      />
    );
  }

  const participantId = getParticipantId(user.email);

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Perfil"
        title="Tu cuenta y preferencias"
        subtitle="Administra tu modo y revisa tu saldo demo."
      />

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="space-between">
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Nombre
              </Typography>
              <Typography variant="h6">{user.name}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="h6">{user.email}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="space-between">
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Saldo demo
              </Typography>
              <Typography variant="h6">{formatMoney(balance, "COP")}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Participante
              </Typography>
              <Typography variant="h6">{participantId || "Sin compras aun"}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between" alignItems="center">
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Modo actual
              </Typography>
              <ModeSwitch />
            </Stack>
            <Button variant="outlined" color="inherit" onClick={logout}>
              Cerrar sesion
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default ProfilePage;
