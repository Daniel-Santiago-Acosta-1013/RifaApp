import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Email, MarkEmailRead, Send } from "@mui/icons-material";
import {
  Alert,
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
import { useAuth, type AuthError } from "../context/AuthContext";

type FeedbackSeverity = "success" | "error" | "info";

type Feedback = {
  severity: FeedbackSeverity;
  title: string;
  detail?: string;
};

type ConfirmEmailLocationState = {
  email?: string;
  notice?: string;
  noticeSeverity?: FeedbackSeverity;
};

const buildErrorFeedback = (title: string, error: AuthError | undefined, fallback: string): Feedback => {
  const usefulCode = error?.code && error.code !== "Error" ? error.code : "";
  const concreteError = usefulCode ? `${usefulCode}: ${error?.message}` : error?.message;
  return {
    severity: "error",
    title,
    detail: concreteError || fallback,
  };
};

const buildConfirmErrorFeedback = (error: AuthError | undefined, email: string): Feedback => {
  if (error?.code === "CodeMismatchException") {
    return {
      severity: "error",
      title: "Codigo incorrecto para este correo",
      detail: `Usa el codigo mas reciente enviado a ${email}. Si reenviaste el codigo, los correos anteriores dejan de servir. Verifica tambien que el correo escrito aqui sea el mismo donde recibiste el codigo.`,
    };
  }
  return buildErrorFeedback("No se pudo confirmar el correo", error, "No se pudo confirmar el correo.");
};

const ConfirmEmailPage = () => {
  const { confirmRegistration, resendRegistrationCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as ConfirmEmailLocationState | null) ?? {};
  const [email, setEmail] = useState(routeState.email || "");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(() =>
    routeState.notice
      ? {
          severity: routeState.noticeSeverity || "success",
          title: routeState.noticeSeverity === "info" ? "Cuenta pendiente de confirmar" : "Codigo enviado",
          detail: routeState.notice,
        }
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    const targetEmail = email.trim();
    if (!targetEmail || !code) {
      setFeedback({
        severity: "error",
        title: "Faltan datos",
        detail: "Ingresa el correo y el codigo de confirmacion.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await confirmRegistration(targetEmail, code.trim());
      if (result.success) {
        navigate("/login", { state: { email: targetEmail } });
        return;
      }
      setFeedback(buildConfirmErrorFeedback(result.error, targetEmail));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setFeedback(null);
    const targetEmail = email.trim();
    if (!targetEmail) {
      setFeedback({
        severity: "error",
        title: "Falta el correo",
        detail: "Ingresa el correo para reenviar el codigo.",
      });
      return;
    }
    setIsResending(true);
    try {
      const result = await resendRegistrationCode(targetEmail);
      if (result.success) {
        setFeedback({
          severity: "success",
          title: "Codigo reenviado",
          detail: `Cognito acepto el envio del nuevo codigo a ${targetEmail}. Revisa la bandeja de entrada y spam.`,
        });
        return;
      }
      setFeedback(buildErrorFeedback("No se pudo reenviar el codigo", result.error, "Cognito no pudo enviar el codigo."));
    } finally {
      setIsResending(false);
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
              <Brand subtitle="Verifica tu correo." />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="h4">Confirmar correo</Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa el codigo que enviamos a tu correo para activar la cuenta.
              </Typography>
            </Stack>

            {feedback && (
              <Alert
                severity={feedback.severity}
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  alignItems: "flex-start",
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <Typography variant="body2" fontWeight={800}>
                  {feedback.title}
                </Typography>
                {feedback.detail && (
                  <Typography variant="body2" sx={{ mt: 0.25 }}>
                    {feedback.detail}
                  </Typography>
                )}
              </Alert>
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
              helperText="Usa el codigo mas reciente enviado al correo escrito arriba."
              inputProps={{ inputMode: "numeric", autoComplete: "one-time-code" }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting || isResending}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <MarkEmailRead />}
              sx={{ py: 1.5, borderRadius: 12 }}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar correo"}
            </Button>
            <Button
              variant="text"
              onClick={handleResend}
              disabled={isSubmitting || isResending}
              startIcon={isResending ? <CircularProgress size={18} color="inherit" /> : <Send />}
            >
              {isResending ? "Reenviando..." : "Reenviar codigo"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ConfirmEmailPage;
