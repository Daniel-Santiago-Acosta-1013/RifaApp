import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";

import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 520, mx: "auto" }}>
      <PageHeader
        eyebrow="Registro"
        title="Crear cuenta"
        subtitle="Tu cuenta unica activa modo comprador y vendedor."
      />
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <TextField
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            fullWidth
          />
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
            inputProps={{ minLength: 8 }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Ya tienes cuenta?{" "}
            <Button variant="text" size="small" href="/login">
              Ingresa aqui
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default RegisterPage;
