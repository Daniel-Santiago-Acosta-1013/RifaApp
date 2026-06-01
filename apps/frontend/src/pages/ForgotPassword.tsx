import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Email, LockReset } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email) {
      setError("Ingresa tu correo.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        navigate("/reset-password", { state: { email } });
        return;
      }
      setError(result.error?.message || "No se pudo enviar el codigo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 4 }}>
      <Container maxWidth="sm">
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            p: { xs: 3, md: 4.5 },
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,248,240,0.95))",
            border: "1px solid rgba(239,231,220,0.9)",
          }}
        >
          <Stack spacing={3}>
            <Stack alignItems="center" spacing={1}>
              <Brand subtitle="Recupera tu cuenta." />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="h4">Cambiar contrasena</Typography>
              <Typography variant="body2" color="text.secondary">
                Te enviaremos un codigo para crear una nueva contrasena.
              </Typography>
            </Stack>

            {error && (
              <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: "rgba(204, 75, 75, 0.08)", border: "1px solid rgba(204, 75, 75, 0.2)" }}>
                <Typography variant="body2" color="error.main" fontWeight={600}>
                  {error}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Correo electronico"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LockReset />}
              sx={{ py: 1.5, borderRadius: 12 }}
            >
              {isSubmitting ? "Enviando..." : "Enviar codigo"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
