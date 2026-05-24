import { useEffect, useMemo, useState } from "react";
import { Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { listRaffles } from "../api/client";
import Onboarding from "../components/Onboarding";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import type { Raffle } from "../types";
import { formatDate, formatMoney } from "../utils/format";

const statusColorMap: Record<string, "default" | "success" | "warning" | "info"> = {
  open: "success",
  closed: "warning",
  drawn: "info",
  draft: "default",
};

const HomePage = () => {
  const { user } = useAuth();
  const { mode, balance } = useApp();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    listRaffles(statusFilter === "all" ? undefined : statusFilter)
      .then((data) => {
        if (active) {
          setRaffles(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Error al cargar rifas");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [statusFilter, user]);

  if (!user) {
    return <Onboarding />;
  }

  const filteredRaffles = useMemo(() => {
    if (!search.trim()) {
      return raffles;
    }
    const term = search.trim().toLowerCase();
    return raffles.filter(
      (raffle) =>
        raffle.title.toLowerCase().includes(term) ||
        (raffle.description || "").toLowerCase().includes(term),
    );
  }, [raffles, search]);

  const totalSold = raffles.reduce((sum, raffle) => sum + raffle.tickets_sold, 0);
  const totalReserved = raffles.reduce((sum, raffle) => sum + raffle.tickets_reserved, 0);
  const totalRevenue = raffles.reduce((sum, raffle) => {
    const price = Number.parseFloat(raffle.ticket_price);
    return sum + (Number.isFinite(price) ? price * raffle.tickets_sold : 0);
  }, 0);

  return (
    <Stack spacing={4}>
      {mode === "sell" ? (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3} direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" color="text.secondary">
                Panel vendedor
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                Gestiona tus rifas con un tablero claro y accionable.
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                Controla ventas, reservas y estado de sorteo desde un solo lugar.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="contained" size="large" href="/create">
                Crear rifa
              </Button>
              <Button variant="outlined" size="large" href="/sell/raffles">
                Ver mis rifas
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3} direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" color="text.secondary">
                Explorar rifas
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                Elige tus numeros con calma y compra en modo demo.
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                Tu saldo simulado esta listo para probar el flujo completo de compra.
              </Typography>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                minWidth: 220,
                textAlign: { xs: "left", md: "center" },
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Saldo demo
              </Typography>
              <Typography variant="h5">{formatMoney(balance, "COP")}</Typography>
              <Button variant="text" href="/wallet" sx={{ mt: 1 }}>
                Administrar saldo
              </Button>
            </Paper>
          </Stack>
        </Paper>
      )}

      {mode === "sell" && (
        <Grid container spacing={2} sx={{ width: "100%" }}>
          {[
            {
              label: "Rifas activas",
              value: raffles.filter((raffle) => raffle.status === "open").length,
            },
            { label: "Boletos vendidos", value: totalSold },
            { label: "Reservas vigentes", value: totalReserved },
            { label: "Ingreso demo", value: formatMoney(totalRevenue, "COP"), highlight: true },
          ].map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  background: stat.highlight
                    ? "linear-gradient(135deg, rgba(243, 107, 79, 0.12), rgba(47, 180, 154, 0.12))"
                    : "background.paper",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h5">{stat.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{mode === "sell" ? "Estado general" : "Rifas disponibles"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === "sell" ? "Revisa el progreso de cada rifa." : "Selecciona tu rifa favorita."}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, value) => value && setStatusFilter(value)}
          size="small"
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 999,
            p: 0.4,
            gap: 0.5,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: 999,
              textTransform: "none",
              px: 2,
            },
          }}
        >
          {[
            { value: "all", label: "Todas" },
            { value: "open", label: "Abiertas" },
            { value: "closed", label: "Cerradas" },
            { value: "drawn", label: "Sorteadas" },
            { value: "draft", label: "Borradores" },
          ].map((filter) => (
            <ToggleButton key={filter.value} value={filter.value}>
              {filter.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <TextField
        fullWidth
        placeholder="Buscar por titulo o descripcion"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Cargando rifas...
          </Typography>
        </Paper>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredRaffles.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Aun no hay rifas para mostrar.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ width: "100%" }}>
          {filteredRaffles.map((raffle) => {
            const progress = Math.min(100, (raffle.tickets_sold / raffle.total_tickets) * 100);
            return (
              <Grid size={{ xs: 12, md: 6 }} key={raffle.id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Chip
                        label={raffle.status}
                        size="small"
                        color={statusColorMap[raffle.status] ?? "default"}
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        {formatMoney(raffle.ticket_price, raffle.currency)}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      {raffle.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {raffle.description || "Sin descripcion, pero con muchas ganas de salir."}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                    </Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {raffle.tickets_sold} / {raffle.total_tickets} vendidos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(progress)}%
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Numero {raffle.number_start}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sorteo {formatDate(raffle.draw_at)}
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="contained" size="small" href={`/raffles/${raffle.id}`}>
                      Ver detalle
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
};

export default HomePage;
