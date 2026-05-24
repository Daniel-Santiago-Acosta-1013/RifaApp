import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Add,
  Close,
  Edit,
  EmojiEvents,
  Remove,
  Save,
  Timer,
  CheckCircle,
  Share,
  Celebration,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import NumberGrid from "../components/NumberGrid";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { type Raffle, type RaffleNumber } from "../types";
import { formatCurrency, formatDate, statusChipColor } from "../utils";

const demoRaffles: Record<string, Raffle> = {
  "1": {
    id: "1",
    title: "Celular Samsung Galaxy S24",
    description: "Rifa semanal con un celular nuevo.",
    ticket_price: "5000",
    currency: "COP",
    total_tickets: 100,
    tickets_sold: 42,
    tickets_reserved: 5,
    status: "active",
    draw_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    number_start: 0,
    number_end: 99,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "2": {
    id: "2",
    title: "Nintendo Switch",
    description: "Rifa de consola de videojuegos.",
    ticket_price: "2000",
    currency: "COP",
    total_tickets: 500,
    tickets_sold: 500,
    tickets_reserved: 0,
    status: "completed",
    draw_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    number_start: 0,
    number_end: 499,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  "3": {
    id: "3",
    title: "Bonos Netflix 1 año",
    description: "Rifa con suscripción anual.",
    ticket_price: "1000",
    currency: "COP",
    total_tickets: 200,
    tickets_sold: 15,
    tickets_reserved: 3,
    status: "active",
    draw_at: new Date(Date.now() + 86400000 * 12).toISOString(),
    number_start: 0,
    number_end: 199,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const generateNumbers = (total: number): RaffleNumber[] =>
  Array.from({ length: total }, (_, i) => ({
    number: i,
    label: String(i).padStart(total > 100 ? 3 : 2, "0"),
    status: (["available", "reserved", "sold"] as RaffleNumber["status"][])[Math.floor(Math.random() * 3)],
  }));

const InfoRow = ({ icon, label, value, color = "text.secondary" }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>{icon}</Box>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} color={color}>
      {value}
    </Typography>
  </Stack>
);

const SectionCard = ({ children, sx }: { children: React.ReactNode; sx?: object }) => (
  <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid rgba(239,231,220,0.8)", ...sx }}>
    {children}
  </Paper>
);

const statusLabels: Record<string, string> = {
  active: "Activa",
  completed: "Finalizada",
  cancelled: "Cancelada",
  draft: "Borrador",
};

const RaffleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const isLoggedIn = !!user;

  const raffle = demoRaffles[id || ""];
  const [numbers] = useState<RaffleNumber[]>(
    raffle ? generateNumbers(raffle.total_tickets) : [],
  );
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: raffle?.title || "",
    description: raffle?.description || "",
    ticket_price: raffle?.ticket_price ? parseFloat(raffle.ticket_price) : 0,
    total_tickets: raffle?.total_tickets || 0,
    draw_at: raffle?.draw_at
      ? new Date(raffle.draw_at).toISOString().split("T")[0]
      : "",
  });
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  if (!raffle) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Rifa no encontrada
        </Typography>
        <Typography variant="body2" color="text.secondary">
          La rifa que buscas no existe.
        </Typography>
      </Container>
    );
  }

  const progress = (raffle.tickets_sold / raffle.total_tickets) * 100;
  const isHot = progress >= 80 && raffle.status === "active";
  const totalPrice = selectedNumbers.length * parseFloat(raffle.ticket_price);

  const toggleNumber = (num: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    );
  };

  const handleBuy = () => {
    setShowBuyDialog(false);
    setSelectedNumbers([]);
    alert("Compra simulada exitosa.");
  };

  const handleSave = () => {
    setEditing(false);
    alert("Cambios guardados (simulado).");
  };

  return (
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          {/* Header hero */}
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              background: isHot
                ? "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,243,236,0.8))"
                : "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(248,245,240,0.8))",
              border: "1px solid",
              borderColor: isHot ? "rgba(243,107,79,0.2)" : "rgba(239,231,220,0.8)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background: isHot
                      ? "linear-gradient(135deg, rgba(243,107,79,0.15), rgba(255,176,137,0.3))"
                      : "linear-gradient(135deg, rgba(47,180,154,0.12), rgba(143,226,211,0.25))",
                    color: isHot ? "primary.main" : "secondary.main",
                  }}
                >
                  {raffle.status === "completed" ? <Celebration sx={{ fontSize: 32 }} /> : <EmojiEvents sx={{ fontSize: 32 }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                    <Typography variant="h4">{raffle.title}</Typography>
                    <Chip
                      label={statusLabels[raffle.status] || raffle.status}
                      size="small"
                      color={statusChipColor(raffle.status)}
                      sx={{ height: 26 }}
                    />
                    {isHot && (
                      <Chip
                        label="🔥 Casi llena"
                        size="small"
                        sx={{
                          height: 26,
                          backgroundColor: "rgba(243,107,79,0.1)",
                          color: "primary.dark",
                          border: "1px solid rgba(243,107,79,0.2)",
                        }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {raffle.description}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <InfoRow
                    icon={<EmojiEvents fontSize="small" />}
                    label="Precio:"
                    value={formatCurrency(raffle.ticket_price, raffle.currency)}
                    color="primary.main"
                  />
                  <InfoRow
                    icon={<CheckCircle fontSize="small" />}
                    label="Vendidos:"
                    value={`${raffle.tickets_sold} / ${raffle.total_tickets}`}
                  />
                  <InfoRow
                    icon={<Timer fontSize="small" />}
                    label="Sorteo:"
                    value={formatDate(raffle.draw_at)}
                  />
                </Stack>

                <Box sx={{ width: "100%" }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: "rgba(28, 31, 38, 0.06)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background: isHot
                          ? "linear-gradient(90deg, #F36B4F, #FFB089)"
                          : "linear-gradient(90deg, #2FB49A, #8FE2D3)",
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* Actions */}
          {isLoggedIn && (
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setEditing(!editing)}
                size="large"
                sx={{ borderRadius: 999 }}
              >
                {editing ? "Cancelar edicion" : "Editar rifa"}
              </Button>
              {raffle.status === "active" && (
                <Button variant="contained" size="large" sx={{ borderRadius: 999 }}>
                  Sortear ganador
                </Button>
              )}
              <Button variant="outlined" startIcon={<Share />} size="large" sx={{ borderRadius: 999, ml: "auto" }}>
                Compartir
              </Button>
            </Stack>
          )}

          {/* Edit form */}
          {isLoggedIn && editing && (
            <SectionCard>
              <Stack spacing={3}>
                <Typography variant="h6">Editar rifa</Typography>
                <TextField
                  fullWidth
                  label="Titulo"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Descripcion"
                  multiline
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Precio por numero (COP)"
                  type="number"
                  value={editForm.ticket_price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ticket_price: Number(e.target.value) })
                  }
                />
                <TextField
                  fullWidth
                  label="Total de numeros"
                  type="number"
                  value={editForm.total_tickets}
                  onChange={(e) =>
                    setEditForm({ ...editForm, total_tickets: Number(e.target.value) })
                  }
                />
                <TextField
                  fullWidth
                  label="Fecha de sorteo"
                  type="date"
                  value={editForm.draw_at}
                  onChange={(e) => setEditForm({ ...editForm, draw_at: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Stack direction="row" spacing={1.5}>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSave} size="large">
                    Guardar cambios
                  </Button>
                  <Button variant="outlined" onClick={() => setEditing(false)} size="large">
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          )}

          {/* Number grid */}
          <SectionCard>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" justifyContent="space-between">
                <Typography variant="h6">Selecciona tus numeros</Typography>
                <Stack direction="row" spacing={1}>
                  {(
                    [
                      ["available", "Disponible", "rgba(47, 180, 154, 0.12)", "#2FB49A"],
                      ["reserved", "Reservado", "rgba(244, 161, 79, 0.12)", "#F4A14F"],
                      ["sold", "Vendido", "rgba(204, 75, 75, 0.12)", "#CC4B4B"],
                    ] as [RaffleNumber["status"], string, string, string][]
                  ).map(([status, label, bg, color]) => (
                    <Stack key={status} direction="row" spacing={0.5} alignItems="center">
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "4px",
                          backgroundColor: bg,
                          border: `2px solid ${color}`,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              <NumberGrid
                numbers={numbers}
                selectedNumbers={selectedNumbers}
                onToggle={toggleNumber}
                disabled={raffle.status !== "active" || !isLoggedIn}
              />
            </Stack>
          </SectionCard>

          {/* Cart summary */}
          {isLoggedIn && raffle.status === "active" && (
            <SectionCard
              sx={{
                background: selectedNumbers.length > 0 ? "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,243,236,0.5))" : undefined,
                borderColor: selectedNumbers.length > 0 ? "rgba(243,107,79,0.25)" : undefined,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedNumbers.length} numeros seleccionados
                  </Typography>
                  {selectedNumbers.length > 0 && (
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(totalPrice, raffle.currency)}
                    </Typography>
                  )}
                </Stack>
                <Button
                  variant="contained"
                  size="large"
                  disabled={selectedNumbers.length === 0}
                  onClick={() => setShowBuyDialog(true)}
                  sx={{ borderRadius: 999, px: 4 }}
                >
                  Comprar numeros
                </Button>
              </Stack>
            </SectionCard>
          )}
        </Stack>
      </Container>

      {/* Buy dialog */}
      <Dialog open={showBuyDialog} onClose={() => setShowBuyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">Confirmar compra</Typography>
            <IconButton onClick={() => setShowBuyDialog(false)} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Numeros seleccionados:
              </Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap">
                {selectedNumbers.map((n) => (
                  <Chip
                    key={n}
                    label={String(n).padStart(raffle.total_tickets > 100 ? 3 : 2, "0")}
                    size="small"
                    color="primary"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Stack>
            </Stack>

            <Paper sx={{ p: 2.5, borderRadius: 3, backgroundColor: "rgba(47,180,154,0.06)", border: "1px solid rgba(47,180,154,0.15)" }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {selectedNumbers.length} x{" "}
                    {formatCurrency(raffle.ticket_price, raffle.currency)}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(totalPrice, raffle.currency)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tarifa de servicio
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(0, raffle.currency)}
                  </Typography>
                </Stack>
                <Box sx={{ height: 1, backgroundColor: "divider", my: 0.5 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total a pagar
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                    {formatCurrency(totalPrice, raffle.currency)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              Esta es una compra simulada. No se procesara ningun pago real.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button onClick={() => setShowBuyDialog(false)} variant="outlined" size="large" sx={{ borderRadius: 999 }}>
            Cancelar
          </Button>
          <Button variant="contained" size="large" onClick={handleBuy} sx={{ borderRadius: 999, px: 4 }}>
            Confirmar compra
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RaffleDetail;
