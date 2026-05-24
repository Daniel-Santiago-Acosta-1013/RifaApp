import { useState } from "react";
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

import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const CreateRaffle = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_per_ticket: "",
    total_tickets: "",
    draw_date: "",
  });
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
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
              borderRadius: 4,
              background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,248,240,0.95))",
              border: "1px solid rgba(239,231,220,0.9)",
            }}
          >
            <Stack spacing={3}>
              {submitted && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(47, 180, 154, 0.08)",
                    border: "1px solid rgba(47, 180, 154, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Celebration sx={{ color: "secondary.main" }} />
                  <Typography variant="body2" fontWeight={600} color="secondary.dark">
                    Rifa creada exitosamente (simulado).
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
                required
                placeholder="Describe el premio y las reglas de la rifa"
              />

              <TextField
                fullWidth
                label="Precio por numero (COP)"
                type="number"
                value={formData.price_per_ticket}
                onChange={(e) => setFormData({ ...formData, price_per_ticket: e.target.value })}
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
                sx={{ py: 1.5, borderRadius: 14 }}
              >
                Crear rifa
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default CreateRaffle;
