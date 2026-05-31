import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AccountBalanceWallet,
  Celebration,
  CheckCircle,
  Edit,
  EmojiEvents,
  EventAvailable,
  Save,
  Share,
  ShoppingCart,
  Timer,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  confirmPurchase,
  drawRaffle,
  getRaffle,
  getRaffleNumbers,
  releaseReservation,
  reserveNumbers,
  updateRaffle,
} from "../api/client";
import { getRealtimeWebsocketUrl, type RaffleNumbersChangedEvent } from "../api/realtime";
import NumberGrid from "../components/NumberGrid";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { type DrawResponse, type PurchaseConfirmResponse, type Raffle, type RaffleNumber, type ReservationResponse } from "../types";
import {
  RAFFLE_STATUS_LABELS,
  formatCopInput,
  formatCurrency,
  formatDate,
  getCurrencyDigits,
  isRaffleCompleted,
  isRaffleOpen,
  statusChipColor,
} from "../utils";
import { setParticipantId } from "../utils/participants";

const InfoRow = ({ icon, label, value, color = "text.secondary" }: { icon: ReactNode; label: string; value: string | number; color?: string }) => (
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

const SectionCard = ({ children, sx }: { children: ReactNode; sx?: object }) => (
  <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid rgba(239,231,220,0.8)", ...sx }}>
    {children}
  </Paper>
);

const PurchaseNumbers = ({ numbers, totalTickets }: { numbers: number[]; totalTickets: number }) => (
  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
    {numbers.map((number) => (
      <Chip
        key={number}
        label={String(number).padStart(totalTickets > 100 ? 3 : 2, "0")}
        size="small"
        color="primary"
        sx={{ borderRadius: 2 }}
      />
    ))}
  </Stack>
);

const RaffleDetail = () => {
  const { raffleId } = useParams<{ raffleId: string }>();
  const { user } = useAuth();
  const { balance, credit, debit } = useApp();
  const isLoggedIn = !!user;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [purchase, setPurchase] = useState<PurchaseConfirmResponse | null>(null);
  const [purchaseError, setPurchaseError] = useState("");
  const [reserving, setReserving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    ticket_price: "",
    total_tickets: 0,
    draw_at: "",
  });

  const loadRaffle = useCallback(async () => {
    if (!raffleId) {
      setLoading(false);
      return;
    }

    const [raffleData, numbersData] = await Promise.all([
      getRaffle(raffleId),
      getRaffleNumbers(raffleId),
    ]);

    setRaffle(raffleData);
    setNumbers(numbersData.numbers);
    setEditForm({
      title: raffleData.title || "",
      description: raffleData.description || "",
      ticket_price: raffleData.ticket_price ? String(raffleData.ticket_price) : "",
      total_tickets: raffleData.total_tickets || 0,
      draw_at: raffleData.draw_at ? new Date(raffleData.draw_at).toISOString().split("T")[0] : "",
    });
    setError("");
  }, [raffleId]);

  useEffect(() => {
    setLoading(true);
    loadRaffle()
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar la rifa");
      })
      .finally(() => setLoading(false));
  }, [loadRaffle]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      loadRaffle().catch(() => {
        // El siguiente evento o refresco manual vuelve a sincronizar la grilla.
      });
    }, 350);
  }, [loadRaffle]);

  useEffect(() => {
    if (!raffleId) return undefined;

    const realtimeUrl = getRealtimeWebsocketUrl();
    if (!realtimeUrl) return undefined;

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let closedByPage = false;

    const connect = () => {
      socket = new WebSocket(realtimeUrl);

      socket.addEventListener("open", () => {
        socket?.send(JSON.stringify({ action: "subscribe", raffle_id: raffleId }));
      });

      socket.addEventListener("message", (message) => {
        let event: RaffleNumbersChangedEvent;
        try {
          event = JSON.parse(String(message.data));
        } catch {
          return;
        }

        if (event.type !== "raffle_numbers_changed" || event.raffle_id !== raffleId) {
          return;
        }

        const changedNumbers = new Set(event.numbers);
        setNumbers((current) =>
          current.map((item) =>
            changedNumbers.has(item.number)
              ? {
                  ...item,
                  status: event.status,
                  reserved_until: event.status === "reserved" ? event.reserved_until || null : null,
                }
              : item,
          ),
        );
        if (event.status !== "available") {
          setSelectedNumbers((current) => current.filter((number) => !changedNumbers.has(number)));
        }
        scheduleRealtimeRefresh();
      });

      socket.addEventListener("close", () => {
        if (!closedByPage) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      });
    };

    connect();

    return () => {
      closedByPage = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      socket?.close();
    };
  }, [raffleId, scheduleRealtimeRefresh]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Cargando rifa...
        </Typography>
      </Container>
    );
  }

  if (error || !raffle) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Rifa no encontrada
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error || "La rifa que buscas no existe."}
        </Typography>
      </Container>
    );
  }

  const progress = Math.min(100, (raffle.tickets_sold / raffle.total_tickets) * 100);
  const raffleOpen = isRaffleOpen(raffle.status);
  const isHot = progress >= 80 && raffleOpen;
  const totalPrice = reservation
    ? parseFloat(String(reservation.total_price))
    : selectedNumbers.length * parseFloat(String(raffle.ticket_price));
  const reservedNumbers = reservation?.numbers ?? purchase?.numbers ?? [];
  const canSelectNumbers = raffleOpen && isLoggedIn && !reservation && !purchase;
  const isOwner = !!user && raffle.owner_id === user.id;

  const refreshNumbers = async () => {
    try {
      await loadRaffle();
    } catch {
      // La compra ya cambio de estado localmente; si falla el refresco, el siguiente load lo corrige.
    }
  };

  const toggleNumber = (num: number) => {
    if (!canSelectNumbers) return;
    setSelectedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    );
  };

  const handleReserve = async () => {
    if (!raffleId || !user || selectedNumbers.length === 0) return;

    setReserving(true);
    setPurchaseError("");
    try {
      const response = await reserveNumbers(raffleId, {
        participant: {
          name: user.name,
          email: user.email,
        },
        numbers: selectedNumbers,
        ttl_minutes: 10,
      });
      setReservation(response);
      setSelectedNumbers([]);
      setParticipantId(user.email, response.participant_id);
      await refreshNumbers();
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudo reservar. Intenta de nuevo.");
    } finally {
      setReserving(false);
    }
  };

  const handleRelease = async () => {
    if (!raffleId || !reservation) return;

    setReleasing(true);
    setPurchaseError("");
    try {
      await releaseReservation(raffleId, reservation.reservation_id);
      setReservation(null);
      await refreshNumbers();
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudo liberar la reserva.");
    } finally {
      setReleasing(false);
    }
  };

  const handleConfirm = async () => {
    if (!raffleId || !reservation) return;

    const amount = parseFloat(String(reservation.total_price));
    if (!debit(amount)) {
      setPurchaseError("Saldo demo insuficiente para confirmar esta compra.");
      return;
    }

    setConfirming(true);
    setPurchaseError("");
    try {
      const response = await confirmPurchase(raffleId, {
        reservation_id: reservation.reservation_id,
        participant_id: reservation.participant_id,
        payment_method: "demo",
      });
      setPurchase(response);
      setParticipantId(user?.email || "", response.participant_id);
      setReservation(null);
      setSelectedNumbers([]);
      await refreshNumbers();
    } catch (err) {
      credit(amount);
      setPurchaseError(err instanceof Error ? err.message : "No se pudo confirmar la compra.");
    } finally {
      setConfirming(false);
    }
  };

  const handleSave = async () => {
    if (!raffleId || !user) return;

    setSaving(true);
    setPurchaseError("");
    try {
      const updated = await updateRaffle(
        raffleId,
        {
          title: editForm.title,
          description: editForm.description || null,
          ticket_price: Number(editForm.ticket_price),
          total_tickets: Number(editForm.total_tickets),
          draw_at: editForm.draw_at ? new Date(editForm.draw_at).toISOString() : null,
        },
        user.id,
      );
      setRaffle(updated);
      setEditing(false);
      await refreshNumbers();
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleDraw = async () => {
    if (!raffleId) return;

    setDrawing(true);
    setPurchaseError("");
    try {
      const result = await drawRaffle(raffleId);
      setDrawResult(result);
      await refreshNumbers();
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudo sortear la rifa.");
    } finally {
      setDrawing(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: raffle.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setPurchaseError("");
    } catch {
      setPurchaseError("No se pudo compartir el enlace.");
    }
  };

  return (
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
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
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background: isHot
                      ? "linear-gradient(135deg, rgba(243,107,79,0.15), rgba(255,176,137,0.3))"
                      : "linear-gradient(135deg, rgba(47,180,154,0.12), rgba(143,226,211,0.25))",
                    color: isHot ? "primary.main" : "secondary.main",
                  }}
                >
                  {isRaffleCompleted(raffle.status) ? <Celebration sx={{ fontSize: 32 }} /> : <EmojiEvents sx={{ fontSize: 32 }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                    <Typography variant="h4">{raffle.title}</Typography>
                    <Chip
                      label={RAFFLE_STATUS_LABELS[raffle.status] || raffle.status}
                      size="small"
                      color={statusChipColor(raffle.status)}
                      sx={{ height: 26 }}
                    />
                    {isHot && (
                      <Chip
                        label="Casi llena"
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
              </Stack>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={1.5}>
            {isOwner && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setEditing(!editing)}
                  size="large"
                  sx={{ borderRadius: 999 }}
                >
                  {editing ? "Cancelar edicion" : "Editar rifa"}
                </Button>
                {raffleOpen && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleDraw}
                    disabled={drawing}
                    sx={{ borderRadius: 999 }}
                  >
                    {drawing ? "Sorteando..." : "Sortear ganador"}
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<Share />}
              size="large"
              onClick={handleShare}
              sx={{ borderRadius: 999, ml: "auto" }}
            >
              Compartir
            </Button>
          </Stack>

          {isOwner && editing && (
            <SectionCard>
              <Stack spacing={3}>
                <Typography variant="h6">Editar rifa</Typography>
                {purchaseError && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {purchaseError}
                  </Alert>
                )}
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
                  value={formatCopInput(editForm.ticket_price)}
                  onChange={(e) =>
                    setEditForm({ ...editForm, ticket_price: getCurrencyDigits(e.target.value) })
                  }
                  placeholder="$5.000"
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
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
                  <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} size="large">
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button variant="outlined" onClick={() => setEditing(false)} size="large">
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          )}

          {drawResult && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Numero ganador: {String(drawResult.winning_number).padStart(raffle.total_tickets > 100 ? 3 : 2, "0")}
            </Alert>
          )}

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
                reservedNumbers={reservedNumbers}
                onToggle={toggleNumber}
                disabled={!canSelectNumbers}
              />
            </Stack>
          </SectionCard>

          {purchaseError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {purchaseError}
            </Alert>
          )}

          {!isLoggedIn && raffleOpen && (
            <SectionCard>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Inicia sesion para reservar numeros y completar la compra.
                </Typography>
                <Button component={Link} to="/login" variant="contained" sx={{ borderRadius: 999 }}>
                  Iniciar sesion
                </Button>
              </Stack>
            </SectionCard>
          )}

          {isLoggedIn && raffleOpen && !reservation && !purchase && (
            <SectionCard
              sx={{
                background: selectedNumbers.length > 0 ? "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(255,243,236,0.5))" : undefined,
                borderColor: selectedNumbers.length > 0 ? "rgba(243,107,79,0.25)" : undefined,
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
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
                  startIcon={reserving ? <CircularProgress size={18} color="inherit" /> : <ShoppingCart />}
                  disabled={selectedNumbers.length === 0 || reserving}
                  onClick={handleReserve}
                  sx={{ borderRadius: 999, px: 4 }}
                >
                  Reservar numeros
                </Button>
              </Stack>
            </SectionCard>
          )}

          {isLoggedIn && reservation && !purchase && (
            <SectionCard
              sx={{
                background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(239,251,248,0.75))",
                borderColor: "rgba(47,180,154,0.25)",
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EventAvailable color="secondary" />
                  <Box>
                    <Typography variant="h6">Reserva activa</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expira el {formatDate(reservation.expires_at)}
                    </Typography>
                  </Box>
                </Stack>

                <PurchaseNumbers numbers={reservation.numbers} totalTickets={raffle.total_tickets} />

                <Paper sx={{ p: 2.5, borderRadius: 3, backgroundColor: "rgba(47,180,154,0.06)", border: "1px solid rgba(47,180,154,0.15)" }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total a pagar
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        {formatCurrency(reservation.total_price, reservation.currency)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                        <AccountBalanceWallet fontSize="small" />
                        <Typography variant="body2">Saldo demo</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(balance, reservation.currency)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={releasing || confirming}
                    onClick={handleRelease}
                    sx={{ borderRadius: 999 }}
                  >
                    Liberar reserva
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={confirming || releasing}
                    onClick={handleConfirm}
                    startIcon={confirming ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                    sx={{ borderRadius: 999, px: 4 }}
                  >
                    Confirmar compra
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          )}

          {purchase && (
            <SectionCard
              sx={{
                background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(239,251,248,0.75))",
                borderColor: "rgba(47,180,154,0.25)",
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircle color="secondary" />
                  <Box>
                    <Typography variant="h6">Compra completada</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tus numeros quedaron confirmados para esta rifa.
                    </Typography>
                  </Box>
                </Stack>
                <PurchaseNumbers numbers={purchase.numbers} totalTickets={raffle.total_tickets} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(purchase.total_price, purchase.currency)}
                  </Typography>
                  <Button component={Link} to="/purchases" variant="contained" sx={{ borderRadius: 999, px: 4 }}>
                    Ver mis compras
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default RaffleDetail;
