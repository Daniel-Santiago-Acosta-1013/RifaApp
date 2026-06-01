import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Email, MarkEmailRead } from "@mui/icons-material";
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

const ConfirmEmailPage = () => {
  const { confirmRegistration, resendRegistrationCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email || !code) {
      setError("Ingresa el correo y el codigo de confirmacion.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await confirmRegistration(email, code.trim());
      if (result.success) {
        navigate("/login", { state: { email } });
        return;
      }
      setError(result.error?.message || "No se pudo confirmar el correo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Ingresa el correo para reenviar el codigo.");
      return;
    }
    const result = await resendRegistrationCode(email);
    if (result.success) {
      setMessage("Te enviamos un nuevo codigo.");
      return;
    }
    setError(result.error?.message || "No se pudo reenviar el codigo.");
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
              <Brand subtitle="Verifica tu correo." />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="h4">Confirmar correo</Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa el codigo que enviamos a tu correo para activar la cuenta.
              </Typography>
            </Stack>

            {(error || message) && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: error ? "rgba(204, 75, 75, 0.08)" : "rgba(47,180,154,0.08)",
                  border: error ? "1px solid rgba(204, 75, 75, 0.2)" : "1px solid rgba(47,180,154,0.2)",
                }}
              >
                <Typography variant="body2" color={error ? "error.main" : "secondary.main"} fontWeight={600}>
                  {error || message}
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
            <TextField
              fullWidth
              label="Codigo"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              inputProps={{ inputMode: "numeric" }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <MarkEmailRead />}
              sx={{ py: 1.5, borderRadius: 12 }}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar correo"}
            </Button>
            <Button variant="text" onClick={handleResend}>
              Reenviar codigo
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ConfirmEmailPage;
