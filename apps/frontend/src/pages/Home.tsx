import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FilterList,
  Add,
  EmojiEvents,
  TrendingUp,
  Timer,
  CheckCircle,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  Fab,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";

import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { type Raffle } from "../types";
import { RAFFLE_STATUS_LABELS, formatCurrency, formatDate, statusChipColor } from "../utils";

const demoRaffles: Raffle[] = [
  {
    id: "1",
    title: "Celular Samsung Galaxy S24",
    description: "Rifa semanal con un celular nuevo.",
    ticket_price: "5000",
    currency: "COP",
    total_tickets: 100,
    tickets_sold: 42,
    tickets_reserved: 5,
    status: "active",
    draw_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    number_start: 0,
    number_end: 99,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Nintendo Switch",
    description: "Rifa de consola de videojuegos.",
    ticket_price: "2000",
    currency: "COP",
    total_tickets: 500,
    tickets_sold: 500,
    tickets_reserved: 0,
    status: "completed",
    draw_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    number_start: 0,
    number_end: 499,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Bonos Netflix 1 año",
    description: "Rifa con suscripción anual.",
    ticket_price: "1000",
    currency: "COP",
    total_tickets: 200,
    tickets_sold: 15,
    tickets_reserved: 3,
    status: "active",
    draw_at: new Date(Date.now() + 86400000 * 12).toISOString(),
    number_start: 0,
    number_end: 199,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const statusFilters = [
  { value: "all", label: "Todas", icon: <FilterList /> },
  { value: "active", label: "Activas", icon: <TrendingUp fontSize="small" /> },
  { value: "completed", label: "Finalizadas", icon: <CheckCircle fontSize="small" /> },
];

const EmptyState = () => (
  <Stack alignItems="center" spacing={3} sx={{ py: 10, textAlign: "center" }}>
    <Box
      sx={{
        width: 96,
        height: 96,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, rgba(243,107,79,0.12), rgba(255,176,137,0.2))",
        color: "primary.main",
      }}
    >
      <EmojiEvents sx={{ fontSize: 40 }} />
    </Box>
    <Stack spacing={1} maxWidth={320}>
      <Typography variant="h5">No hay rifas todavia</Typography>
      <Typography variant="body2" color="text.secondary">
        ¡Crea tu primera rifa y empieza a compartir!
      </Typography>
    </Stack>
    <Button variant="contained" size="large" startIcon={<Add />} href="/create">
      Crear rifa
    </Button>
  </Stack>
);

const Home = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = demoRaffles
    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter));

  return (
    <Box component="main">
      {!isLoggedIn && <Onboarding />}
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <PageHeader
            title={isLoggedIn ? "Tus rifas" : "Rifas activas"}
            subtitle={
              isLoggedIn
                ? "Crea y gestiona tus rifas."
                : "Explora las rifas disponibles en modo demo."
            }
            actions={
              isLoggedIn ? (
                <Button variant="contained" startIcon={<Add />} size="large" href="/create">
                  Crear rifa
                </Button>
              ) : undefined
            }
          />

          <Stack spacing={3}>
            <TextField
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar rifas..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <ToggleButtonGroup
              exclusive
              fullWidth
              value={statusFilter}
              onChange={(_, v) => v && setStatusFilter(v)}
              size="small"
              color="primary"
            >
              {statusFilters.map((f) => (
                <ToggleButton key={f.value} value={f.value} sx={{ gap: 0.5 }}>
                  {f.icon}
                  {f.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={2.5}>
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((raffle) => {
                const progress = (raffle.tickets_sold / raffle.total_tickets) * 100;
                const isHot = progress >= 80 && raffle.status === "active";

                return (
                  <Paper
                    component={Link}
                    to={`/raffles/${raffle.id}`}
                    key={raffle.id}
                    sx={{
                      p: { xs: 2.5, md: 3.5 },
                      display: "flex",
                      flexDirection: "column",
                      gap: 2.5,
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid",
                      borderColor: isHot ? "rgba(243, 107, 79, 0.3)" : "rgba(239, 231, 220, 0.8)",
                      background: isHot
                        ? "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,243,236,0.6))"
                        : "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(250,248,244,0.6))",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": isHot
                        ? {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background:
                              "radial-gradient(circle at top right, rgba(243,107,79,0.08), transparent 70%)",
                            pointerEvents: "none",
                          }
                        : undefined,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            background: isHot
                              ? "linear-gradient(135deg, rgba(243,107,79,0.15), rgba(255,176,137,0.25))"
                              : "linear-gradient(135deg, rgba(47,180,154,0.12), rgba(143,226,211,0.2))",
                            color: isHot ? "primary.main" : "secondary.main",
                          }}
                        >
                          <EmojiEvents sx={{ fontSize: 24 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                            <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
                              {raffle.title}
                            </Typography>
                            <Chip
                              label={RAFFLE_STATUS_LABELS[raffle.status]}
                              size="small"
                              color={statusChipColor(raffle.status)}
                              sx={{ height: 24, fontSize: "0.75rem" }}
                            />
                            {isHot && (
                              <Chip
                                label="🔥 Casi llena"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.75rem",
                                  backgroundColor: "rgba(243,107,79,0.1)",
                                  color: "primary.dark",
                                  border: "1px solid rgba(243,107,79,0.2)",
                                }}
                              />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {raffle.description}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              maximumFractionDigits: 0,
                            }).format(parseFloat(raffle.ticket_price))}
                            <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                              {" / numero"}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {raffle.tickets_sold} / {raffle.total_tickets} vendidos
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                            <Timer fontSize="small" sx={{ fontSize: 16 }} />
                            <Typography variant="body2">{formatDate(raffle.draw_at)}</Typography>
                          </Stack>
                        </Stack>

                        <Box sx={{ width: "100%" }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: "rgba(28, 31, 38, 0.06)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                background: isHot
                                  ? "linear-gradient(90deg, #F36B4F, #FFB089)"
                                  : "linear-gradient(90deg, #2FB49A, #8FE2D3)",
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Stack>
      </Container>

      {isLoggedIn && (
        <Fab
          color="primary"
          aria-label="Crear rifa"
          sx={{ position: "fixed", bottom: 24, right: 24, boxShadow: "0 8px 32px rgba(243,107,79,0.3)" }}
          href="/create"
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default Home;
