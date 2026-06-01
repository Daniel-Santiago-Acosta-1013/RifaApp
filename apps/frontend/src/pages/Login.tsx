import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Email,
  Lock,
  Login,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/");
        return;
      }
      if (result.error?.code === "UserNotConfirmedException") {
        navigate("/confirm-email", { state: { email } });
      } else if (result.error?.status === 401 || result.error?.code === "NotAuthorizedException") {
        setError("Credenciales incorrectas.");
      } else if (result.error?.status === 0 || !result.error?.status) {
        setError(result.error?.message || "Error de conexion. Intenta de nuevo.");
      } else {
        setError(result.error?.message || "Error del servidor. Intenta mas tarde.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 4 }}>
      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
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
                <Brand subtitle="Bienvenido de nuevo." />
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="h4">Iniciar sesion</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ingresa tus datos para continuar.
                </Typography>
              </Stack>

              {error && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: "rgba(204, 75, 75, 0.08)",
                    border: "1px solid rgba(204, 75, 75, 0.2)",
                  }}
                >
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
                onChange={(e) => setEmail(e.target.value)}
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

              <TextField
                fullWidth
                label="Contrasena"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Login />}
                sx={{ py: 1.5, borderRadius: 12 }}
              >
                {isSubmitting ? "Iniciando sesion..." : "Iniciar sesion"}
              </Button>

              <Typography variant="body2" fontWeight={700} color="primary.main" component="a" href="/forgot-password" sx={{ textAlign: "center", textDecoration: "none" }}>
                Olvidaste tu contrasena?
              </Typography>

              <Stack direction="row" spacing={0.5} justifyContent="center">
                <Typography variant="body2" color="text.secondary">
                  No tienes cuenta?
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main" component="a" href="/register" sx={{ textDecoration: "none" }}>
                  Registrate
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default LoginPage;
