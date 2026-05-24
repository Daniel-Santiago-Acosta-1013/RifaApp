import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";

import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 520, mx: "auto" }}>
      <PageHeader
        eyebrow="Acceso"
        title="Bienvenido de vuelta"
        subtitle="Ingresa para alternar entre comprar y vender rifas."
      />
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Contrasena"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Aun no tienes cuenta?{" "}
            <Button variant="text" size="small" href="/register">
              Crea una aqui
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default LoginPage;
