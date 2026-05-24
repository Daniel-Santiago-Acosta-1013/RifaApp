import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { listRaffles } from "../api/client";
import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import type { Raffle } from "../types";
import { formatDate, formatMoney } from "../utils/format";

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
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Mis rifas"
        title="Inventario y progreso"
        subtitle="Vista general del estado de cada rifa creada."
      />

      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Cargando rifas...
          </Typography>
        </Paper>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : raffles.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Aun no tienes rifas creadas.{" "}
            <Button size="small" href="/create">
              Crear primera rifa
            </Button>
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {raffles.map((raffle) => {
            const progress = Math.min(100, (raffle.tickets_sold / raffle.total_tickets) * 100);
            return (
              <Card key={raffle.id}>
                <CardContent>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
                    <Stack spacing={1}>
                      <Chip label={raffle.status} size="small" />
                      <Typography variant="h6">{raffle.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {raffle.description || "Sin descripcion."}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Vendidos
                        </Typography>
                        <Typography variant="subtitle1">{raffle.tickets_sold}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Reservados
                        </Typography>
                        <Typography variant="subtitle1">{raffle.tickets_reserved}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Sorteo
                        </Typography>
                        <Typography variant="subtitle1">{formatDate(raffle.draw_at)}</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 999, mt: 2 }}
                  />
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatMoney(raffle.ticket_price, raffle.currency)} por numero
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(progress)}% vendido
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button size="small" variant="outlined" href={`/raffles/${raffle.id}`}>
                    Ver detalle
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

export default SellRafflesPage;
