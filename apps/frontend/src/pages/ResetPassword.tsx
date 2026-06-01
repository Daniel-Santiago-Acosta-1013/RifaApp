import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Email, Lock, LockReset } from "@mui/icons-material";
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

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email || !code || !password || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await resetPassword(email, code.trim(), password);
      if (result.success) {
        navigate("/login", { state: { email } });
        return;
      }
      setError(result.error?.message || "No se pudo cambiar la contrasena.");
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
              <Brand subtitle="Define una nueva clave." />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="h4">Nueva contrasena</Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa el codigo recibido y tu nueva contrasena.
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
            <TextField fullWidth label="Codigo" value={code} onChange={(event) => setCode(event.target.value)} required inputProps={{ inputMode: "numeric" }} />
            <TextField
              fullWidth
              label="Nueva contrasena"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField fullWidth label="Confirmar contrasena" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LockReset />}
              sx={{ py: 1.5, borderRadius: 12 }}
            >
              {isSubmitting ? "Guardando..." : "Guardar contrasena"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
