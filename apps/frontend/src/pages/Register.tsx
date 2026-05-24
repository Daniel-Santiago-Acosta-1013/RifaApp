import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Email,
  Lock,
  Person,
  PersonAdd,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  Button,
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

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    const success = await register(name, email, password);
    if (success) {
      navigate("/");
    } else {
      setError("El correo ya esta registrado.");
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
                <Brand subtitle="Crea tu cuenta para empezar." />
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="h4">Crear cuenta</Typography>
                <Typography variant="body2" color="text.secondary">
                  Registrate para comprar o crear rifas.
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
                label="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

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

              <TextField
                fullWidth
                label="Confirmar contrasena"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PersonAdd />}
                sx={{ py: 1.5, borderRadius: 12 }}
              >
                Crear cuenta
              </Button>

              <Stack direction="row" spacing={0.5} justifyContent="center">
                <Typography variant="body2" color="text.secondary">
                  Ya tienes cuenta?
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main" component="a" href="/login" sx={{ textDecoration: "none" }}>
                  Inicia sesion
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default Register;
