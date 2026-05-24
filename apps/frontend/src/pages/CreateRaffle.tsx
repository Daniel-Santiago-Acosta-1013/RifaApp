import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Celebration, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { createRaffle } from "../api/client";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const CreateRaffle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticket_price: "",
    total_tickets: "",
    draw_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Acceso denegado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Inicia sesion para crear rifas.
        </Typography>
      </Container>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.title || !formData.ticket_price || !formData.total_tickets || !formData.draw_date) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setSubmitting(true);
    try {
      const raffle = await createRaffle({
        title: formData.title,
        description: formData.description || undefined,
        ticket_price: Number(formData.ticket_price),
        currency: "COP",
        total_tickets: Number(formData.total_tickets),
        draw_at: new Date(formData.draw_date).toISOString(),
        number_start: 0,
        number_padding: null,
      });
      navigate(`/raffles/${raffle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la rifa");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="main">
      <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <PageHeader
            title="Crear rifa"
            subtitle="Configura los detalles de tu nueva rifa."
          />

          <Paper
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 3, md: 4.5 },
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,248,240,0.95))",
              border: "1px solid rgba(239,231,220,0.9)",
            }}
          >
            <Stack spacing={3}>
              {error && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(204, 75, 75, 0.08)",
                    border: "1px solid rgba(204, 75, 75, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Celebration sx={{ color: "error.main" }} />
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {error}
                  </Typography>
                </Box>
              )}

              <TextField
                fullWidth
                label="Titulo de la rifa"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ej: iPhone 15 Pro"
              />

              <TextField
                fullWidth
                label="Descripcion"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el premio y las reglas de la rifa"
              />

              <TextField
                fullWidth
                label="Precio por numero (COP)"
                type="number"
                value={formData.ticket_price}
                onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                required
                placeholder="5000"
              />

              <TextField
                fullWidth
                label="Cantidad de numeros"
                type="number"
                value={formData.total_tickets}
                onChange={(e) => setFormData({ ...formData, total_tickets: e.target.value })}
                required
                placeholder="100"
              />

              <TextField
                fullWidth
                label="Fecha del sorteo"
                type="date"
                value={formData.draw_date}
                onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={<Save />}
                disabled={submitting}
                sx={{ py: 1.5, borderRadius: 12 }}
              >
                {submitting ? "Creando..." : "Crear rifa"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default CreateRaffle;
