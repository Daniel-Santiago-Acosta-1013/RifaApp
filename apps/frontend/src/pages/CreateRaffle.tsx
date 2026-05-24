import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { createRaffle } from "../api/client";
import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";

const numberFormats = [
  { id: "00-99", label: "00 - 99", number_start: 0, number_padding: 2, total_tickets: 100 },
  { id: "000-999", label: "000 - 999", number_start: 0, number_padding: 3, total_tickets: 1000 },
  { id: "1-100", label: "1 - 100", number_start: 1, number_padding: null, total_tickets: 100 },
  { id: "1-1000", label: "1 - 1000", number_start: 1, number_padding: null, total_tickets: 1000 },
  { id: "custom", label: "Personalizado", number_start: 1, number_padding: null, total_tickets: 50 },
];

const steps = ["Idea", "Numeros", "Fecha", "Confirmar"];

const CreateRafflePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketPrice, setTicketPrice] = useState("5000");
  const [currency, setCurrency] = useState("COP");
  const [formatId, setFormatId] = useState("00-99");
  const [totalTickets, setTotalTickets] = useState("100");
  const [numberStart, setNumberStart] = useState("0");
  const [numberPadding, setNumberPadding] = useState("2");
  const [drawAt, setDrawAt] = useState("");
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (!user) {
    return (
      <Onboarding
        title="Necesitas una cuenta para crear rifas"
        subtitle="Registra tu perfil para desbloquear la creacion de rifas."
      />
    );
  }

  const format = useMemo(() => numberFormats.find((item) => item.id === formatId), [formatId]);

  const handleFormatChange = (nextId: string) => {
    setFormatId(nextId);
    const selected = numberFormats.find((item) => item.id === nextId);
    if (!selected) {
      return;
    }
    setTotalTickets(String(selected.total_tickets));
    setNumberStart(String(selected.number_start));
    setNumberPadding(selected.number_padding ? String(selected.number_padding) : "");
  };

  const totalPreview = useMemo(() => {
    const price = Number.parseFloat(ticketPrice);
    const qty = Number.parseInt(totalTickets, 10);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) {
      return 0;
    }
    return price * qty;
  }, [ticketPrice, totalTickets]);

  const goNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setCreatedId(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        ticket_price: Number(ticketPrice),
        currency: currency.toUpperCase(),
        total_tickets: Number(totalTickets),
        draw_at: drawAt ? new Date(drawAt).toISOString() : undefined,
        number_start: Number(numberStart),
        number_padding: numberPadding ? Number(numberPadding) : null,
        status,
        owner_id: user.id,
      };
      const raffle = await createRaffle(payload);
      setCreatedId(raffle.id);
      setStep(4);
      navigate(`/raffles/${raffle.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la rifa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Nueva rifa"
        title="Crea tu rifa paso a paso"
        subtitle="Define historia, numeros, precio y fecha en minutos."
      />

      <Stepper activeStep={step - 1} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 1 && (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Titulo"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Rifa iPhone 15"
              required
              fullWidth
            />
            <TextField
              label="Descripcion"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Cuenta por que esta rifa es especial."
              multiline
              minRows={4}
              fullWidth
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={goNext} disabled={!title.trim()}>
                Continuar
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {step === 2 && (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Precio por numero (COP)"
                type="number"
                fullWidth
                value={ticketPrice}
                onChange={(event) => setTicketPrice(event.target.value)}
                inputProps={{ min: 1000, step: 500 }}
              />
              <TextField
                label="Moneda"
                fullWidth
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                inputProps={{ maxLength: 3 }}
              />
            </Stack>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Formato de numeros
              </Typography>
              <ToggleButtonGroup
                value={formatId}
                exclusive
                onChange={(_, value) => value && handleFormatChange(value)}
                sx={{
                  flexWrap: "wrap",
                  gap: 1,
                  "& .MuiToggleButton-root": {
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: "divider",
                    textTransform: "none",
                    px: 2,
                  },
                }}
              >
                {numberFormats.map((item) => (
                  <ToggleButton key={item.id} value={item.id}>
                    {item.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            {format?.id === "custom" && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Numero inicial"
                  type="number"
                  fullWidth
                  value={numberStart}
                  onChange={(event) => setNumberStart(event.target.value)}
                />
                <TextField
                  label="Relleno (digitos)"
                  type="number"
                  fullWidth
                  value={numberPadding}
                  onChange={(event) => setNumberPadding(event.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Stack>
            )}
            <TextField
              label="Total de numeros"
              type="number"
              fullWidth
              value={totalTickets}
              onChange={(event) => setTotalTickets(event.target.value)}
              inputProps={{ min: 1 }}
            />
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Recaudo estimado
              </Typography>
              <Typography variant="h5">{formatMoney(totalPreview, currency)}</Typography>
            </Paper>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="text" onClick={goBack}>
                Volver
              </Button>
              <Button variant="contained" onClick={goNext}>
                Continuar
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {step === 3 && (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Fecha del sorteo (opcional)"
              type="datetime-local"
              value={drawAt}
              onChange={(event) => setDrawAt(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Estado inicial
              </Typography>
              <ToggleButtonGroup
                value={status}
                exclusive
                onChange={(_, value) => value && setStatus(value)}
                sx={{
                  gap: 1,
                  "& .MuiToggleButton-root": {
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: "divider",
                    textTransform: "none",
                    px: 2,
                  },
                }}
              >
                {[
                  { value: "open", label: "Publicar ahora" },
                  { value: "draft", label: "Guardar borrador" },
                ].map((item) => (
                  <ToggleButton key={item.value} value={item.value}>
                    {item.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="text" onClick={goBack}>
                Volver
              </Button>
              <Button variant="contained" onClick={goNext}>
                Revisar
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {step === 4 && (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h5">Resumen final</Typography>
            <Divider />
            {[
              { label: "Titulo", value: title || "Sin titulo" },
              { label: "Formato", value: format?.label || "Sin formato" },
              { label: "Precio", value: formatMoney(ticketPrice, currency) },
              { label: "Total numeros", value: totalTickets },
              { label: "Sorteo", value: drawAt || "Sin fecha" },
            ].map((row) => (
              <Stack key={row.label} direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {row.label}
                </Typography>
                <Typography variant="subtitle2">{row.value}</Typography>
              </Stack>
            ))}
            {error && <Alert severity="error">{error}</Alert>}
            {createdId && (
              <Alert severity="success">
                Rifa creada con exito.{" "}
                <Button size="small" href={`/raffles/${createdId}`}>
                  Ver detalle
                </Button>
              </Alert>
            )}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="text" onClick={goBack} disabled={loading}>
                Volver
              </Button>
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? "Creando..." : "Crear rifa"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default CreateRafflePage;
