import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowForward,
  Celebration,
  CheckCircle,
  EmojiEvents,
  Timer,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { listRaffles } from "../api/client";
import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { type Raffle } from "../types";
import { RAFFLE_STATUS_LABELS, formatCurrency, formatDate, isRaffleCompleted, isRaffleOpen, statusChipColor } from "../utils";

const SellRafflesPage = () => {
  const { user } = useAuth();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listRaffles()
      .then((data) => {
        setRaffles(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar rifas");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <Onboarding
        title="Inicia sesion para gestionar rifas"
        subtitle="Tu panel de vendedor se activa con una cuenta."
      />
    );
  }

  return (
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <PageHeader
            eyebrow="Mis rifas"
            title="Inventario y progreso"
            subtitle="Vista general del estado de cada rifa creada."
          />

          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              Cargando rifas...
            </Typography>
          ) : error ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                backgroundColor: "rgba(204, 75, 75, 0.08)",
                border: "1px solid rgba(204, 75, 75, 0.2)",
              }}
            >
              <Typography variant="body2" color="error.main" fontWeight={600}>
                {error}
              </Typography>
            </Box>
          ) : raffles.length === 0 ? (
            <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: "center" }}>
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "linear-gradient(135deg, rgba(243,107,79,0.12), rgba(255,176,137,0.2))",
                    color: "primary.main",
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h5">Aun no tienes rifas creadas</Typography>
                <Typography variant="body2" color="text.secondary">
                  Crea tu primera rifa y empieza a vender numeros.
                </Typography>
                <Button variant="contained" size="large" href="/create" sx={{ borderRadius: 999, px: 4 }}>
                  Crear primera rifa
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {raffles.map((raffle) => {
                const progress = Math.min(100, (raffle.tickets_sold / raffle.total_tickets) * 100);
                const isHot = progress >= 80 && isRaffleOpen(raffle.status);
                const isCompleted = isRaffleCompleted(raffle.status);

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
                        : isCompleted
                        ? "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(240,245,255,0.6))"
                        : "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(250,248,244,0.6))",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 32px rgba(18, 22, 33, 0.08)",
                      },
                    }}
                  >
                    <Stack spacing={2.5}>
                      {/* Header: icono + titulo + chip + metricas */}
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
                              : isCompleted
                              ? "linear-gradient(135deg, rgba(91,124,250,0.12), rgba(155,177,255,0.2))"
                              : "linear-gradient(135deg, rgba(47,180,154,0.12), rgba(143,226,211,0.2))",
                            color: isHot ? "primary.main" : isCompleted ? "info.main" : "secondary.main",
                          }}
                        >
                          {isCompleted ? <Celebration sx={{ fontSize: 24 }} /> : <EmojiEvents sx={{ fontSize: 24 }} />}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                              <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
                                {raffle.title}
                              </Typography>
                              <Chip
                                label={RAFFLE_STATUS_LABELS[raffle.status] || raffle.status}
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

                            {raffle.description && (
                              <Typography variant="body2" color="text.secondary">
                                {raffle.description}
                              </Typography>
                            )}
                          </Stack>
                        </Box>

                        {/* Metricas desktop */}
                        <Stack
                          direction="row"
                          spacing={3}
                          sx={{ display: { xs: "none", sm: "flex" }, flexShrink: 0 }}
                        >
                          <Stack spacing={0.5} alignItems="flex-end">
                            <Typography variant="caption" color="text.secondary">
                              Vendidos
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {raffle.tickets_sold}
                            </Typography>
                          </Stack>
                          <Stack spacing={0.5} alignItems="flex-end">
                            <Typography variant="caption" color="text.secondary">
                              Reservados
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {raffle.tickets_reserved}
                            </Typography>
                          </Stack>
                          <Stack spacing={0.5} alignItems="flex-end">
                            <Typography variant="caption" color="text.secondary">
                              Sorteo
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {formatDate(raffle.draw_at)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>

                      {/* Metricas mobile */}
                      <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ display: { sm: "none" } }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CheckCircle fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {raffle.tickets_sold} vendidos
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Timer fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(raffle.draw_at)}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Progress bar */}
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
                                : isCompleted
                                ? "linear-gradient(90deg, #5B7CFA, #9BB1FF)"
                                : "linear-gradient(90deg, #2FB49A, #8FE2D3)",
                            },
                          }}
                        />
                      </Box>

                      {/* Footer: precio + % + boton */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {formatCurrency(raffle.ticket_price, raffle.currency)}
                            <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                              {" / numero"}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(progress)}% vendido
                          </Typography>
                        </Stack>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<ArrowForward />}
                          component={Link}
                          to={`/raffles/${raffle.id}`}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 600 }}
                        >
                          Ver detalle
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default SellRafflesPage;
