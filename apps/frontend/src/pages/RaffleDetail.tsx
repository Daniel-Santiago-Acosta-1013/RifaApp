import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import {
  confirmPurchase,
  deleteRaffle,
  getRaffleNumbers,
  getRaffle,
  releaseReservation,
  reserveNumbers,
  updateRaffle,
} from "../api/client";
import NumberGrid from "../components/NumberGrid";
import Onboarding from "../components/Onboarding";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import type { PurchaseConfirmResponse, RaffleNumber, RaffleUpdate, Raffle, ReservationResponse } from "../types";
import { formatDate, formatMoney } from "../utils/format";
import { setParticipantId } from "../utils/participants";

const statusColorMap: Record<string, "default" | "success" | "warning" | "info"> = {
  open: "success",
  closed: "warning",
  drawn: "info",
  draft: "default",
};

const RaffleDetailPage = () => {
  const { raffleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, debit } = useApp();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [purchase, setPurchase] = useState<PurchaseConfirmResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDrawAt, setEditDrawAt] = useState("");
  const [editStatus, setEditStatus] = useState("open");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toDateTimeInput = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!raffleId) {
      setError("Rifa no encontrada");
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [raffleData, numbersData] = await Promise.all([
          getRaffle(raffleId),
          getRaffleNumbers(raffleId),
        ]);
        setRaffle(raffleData);
        setNumbers(numbersData.numbers);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar la rifa");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [raffleId, user]);

  useEffect(() => {
    if (!reservation?.expires_at) {
      setTimeLeft(null);
      return;
    }
    const interval = window.setInterval(() => {
      const now = Date.now();
      const expiry = new Date(reservation.expires_at).getTime();
      const diff = Math.max(0, expiry - now);
      if (diff <= 0) {
        setTimeLeft("00:00");
        setReservation(null);
        setSelectedNumbers([]);
        if (raffleId) {
          Promise.all([getRaffle(raffleId), getRaffleNumbers(raffleId)]).then(([raffleData, numbersData]) => {
            setRaffle(raffleData);
            setNumbers(numbersData.numbers);
          });
        }
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [reservation, raffleId]);

  const totalSelected = useMemo(() => {
    const price = raffle ? Number.parseFloat(raffle.ticket_price) : 0;
    if (!Number.isFinite(price)) {
      return 0;
    }
    return price * selectedNumbers.length;
  }, [raffle, selectedNumbers.length]);

  const toggleNumber = (value: number) => {
    if (reservation) {
      return;
    }
    setSelectedNumbers((prev) =>
      prev.includes(value) ? prev.filter((number) => number !== value) : [...prev, value],
    );
  };

  const handleReserve = async () => {
    if (!raffleId || !user) {
      return;
    }
    if (selectedNumbers.length === 0) {
      setPurchaseError("Selecciona al menos un numero.");
      return;
    }
    setProcessing(true);
    setPurchaseError(null);
    try {
      const response = await reserveNumbers(raffleId, {
        participant: { name: user.name, email: user.email },
        numbers: selectedNumbers,
        ttl_minutes: 10,
      });
      setReservation(response);
      setParticipantId(user.email, response.participant_id);
      const [refreshedRaffle, refreshedNumbers] = await Promise.all([
        getRaffle(raffleId),
        getRaffleNumbers(raffleId),
      ]);
      setRaffle(refreshedRaffle);
      setNumbers(refreshedNumbers.numbers);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudo reservar");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!raffleId || !reservation) {
      return;
    }
    const total = Number.parseFloat(reservation.total_price);
    if (!Number.isFinite(total)) {
      setPurchaseError("Total invalido");
      return;
    }
    if (balance < total) {
      setPurchaseError("Saldo insuficiente. Recarga saldo demo.");
      return;
    }
    setProcessing(true);
    setPurchaseError(null);
    try {
      const response = await confirmPurchase(raffleId, {
        reservation_id: reservation.reservation_id,
        participant_id: reservation.participant_id,
        payment_method: "demo",
      });
      debit(total);
      setPurchase(response);
      setReservation(null);
      setSelectedNumbers([]);
      const [refreshedRaffle, refreshedNumbers] = await Promise.all([
        getRaffle(raffleId),
        getRaffleNumbers(raffleId),
      ]);
      setRaffle(refreshedRaffle);
      setNumbers(refreshedNumbers.numbers);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudo confirmar");
    } finally {
      setProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (!raffleId || !reservation) {
      return;
    }
    setProcessing(true);
    try {
      await releaseReservation(raffleId, reservation.reservation_id);
      setReservation(null);
      setSelectedNumbers([]);
      const [refreshedRaffle, refreshedNumbers] = await Promise.all([
        getRaffle(raffleId),
        getRaffleNumbers(raffleId),
      ]);
      setRaffle(refreshedRaffle);
      setNumbers(refreshedNumbers.numbers);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "No se pudo liberar la reserva");
    } finally {
      setProcessing(false);
    }
  };

  const isOwner = Boolean(user && raffle?.owner_id && user.id === raffle.owner_id);

  const startEdit = () => {
    if (!raffle) {
      return;
    }
    setEditTitle(raffle.title);
    setEditDescription(raffle.description ?? "");
    setEditDrawAt(toDateTimeInput(raffle.draw_at));
    setEditStatus(raffle.status);
    setEditError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!raffle || !user) {
      return;
    }
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError("El titulo es obligatorio.");
      return;
    }
    const payload: RaffleUpdate = {};
    if (trimmedTitle !== raffle.title) {
      payload.title = trimmedTitle;
    }
    const trimmedDescription = editDescription.trim();
    const currentDescription = raffle.description ?? "";
    if (trimmedDescription !== currentDescription) {
      payload.description = trimmedDescription ? trimmedDescription : null;
    }
    const currentDrawAt = toDateTimeInput(raffle.draw_at);
    if (editDrawAt !== currentDrawAt) {
      payload.draw_at = editDrawAt ? new Date(editDrawAt).toISOString() : null;
    }
    if (editStatus && editStatus !== raffle.status) {
      payload.status = editStatus;
    }
    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await updateRaffle(raffle.id, payload, user.id);
      setRaffle(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo actualizar la rifa");
    } finally {
      setEditSaving(false);
    }
  };

  const openDelete = () => {
    setDeleteInput("");
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (!deleting) {
      setDeleteOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!raffle || !user) {
      return;
    }
    if (deleteInput !== raffle.title) {
      setDeleteError("Escribe el titulo exacto para confirmar.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRaffle(raffle.id, user.id);
      navigate("/sell/raffles", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar la rifa");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <Onboarding
        title="Registra tu cuenta para participar"
        subtitle="Necesitas iniciar sesion para comprar numeros y ver el detalle de cada rifa."
      />
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Cargando rifa...
        </Typography>
      </Paper>
    );
  }

  if (error || !raffle) {
    return <Alert severity="error">{error || "Rifa no encontrada"}</Alert>;
  }

  const progress = Math.min(100, (raffle.tickets_sold / raffle.total_tickets) * 100);
  const isOpen = raffle.status === "open";

  return (
    <Grid container spacing={3} sx={{ width: "100%" }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Chip label={raffle.status} color={statusColorMap[raffle.status] ?? "default"} size="small" />
              <Typography variant="subtitle1" color="text.secondary">
                {formatMoney(raffle.ticket_price, raffle.currency)}
              </Typography>
            </Stack>
            <Typography variant="h4">{raffle.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {raffle.description || "Esta rifa espera tu toque creativo."}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 999 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                {raffle.tickets_sold} / {raffle.total_tickets} vendidos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Stack>
            <Divider />
            <Grid container spacing={2}>
              {[
                { label: "Inicio", value: `#${raffle.number_start}` },
                { label: "Fin", value: `#${raffle.number_end}` },
                { label: "Sorteo", value: formatDate(raffle.draw_at) },
                { label: "Reservados", value: raffle.tickets_reserved },
              ].map((item) => (
                <Grid size={6} key={item.label}>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="subtitle2">{item.value}</Typography>
                </Grid>
              ))}
            </Grid>
            {isOwner && (
              <>
                <Divider />
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Editar rifa</Typography>
                    {!editing && (
                      <Button size="small" variant="outlined" onClick={startEdit}>
                        Editar
                      </Button>
                    )}
                  </Stack>
                  {editing && (
                    <>
                      <TextField
                        label="Titulo"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Descripcion"
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        multiline
                        minRows={3}
                        fullWidth
                      />
                      <TextField
                        label="Fecha del sorteo"
                        type="datetime-local"
                        value={editDrawAt}
                        onChange={(event) => setEditDrawAt(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <ToggleButtonGroup
                        value={editStatus}
                        exclusive
                        onChange={(_, value) => value && setEditStatus(value)}
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
                          { value: "open", label: "Publicada" },
                          { value: "draft", label: "Borrador" },
                          { value: "closed", label: "Cerrada" },
                        ].map((item) => (
                          <ToggleButton key={item.value} value={item.value}>
                            {item.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                      {editError && <Alert severity="error">{editError}</Alert>}
                      <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="text" onClick={cancelEdit} disabled={editSaving}>
                          Cancelar
                        </Button>
                        <Button variant="contained" onClick={handleSaveEdit} disabled={editSaving}>
                          {editSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </Stack>
                    </>
                  )}
                </Stack>
                <Divider />
                <Stack spacing={2}>
                  <Typography variant="subtitle2" color="error">
                    Eliminar rifa
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Esta accion es permanente y elimina la rifa, sus numeros y compras asociadas.
                  </Typography>
                  <Button color="error" variant="outlined" onClick={openDelete}>
                    Eliminar rifa
                  </Button>
                </Stack>
              </>
            )}
            <Button variant="text" color="inherit" href="/">
              Volver al catalogo
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Selecciona tus numeros</Typography>
            {!isOpen && <Alert severity="info">Esta rifa ya no acepta compras.</Alert>}
            <NumberGrid
              numbers={numbers}
              selectedNumbers={selectedNumbers}
              reservedNumbers={reservation?.numbers}
              onToggle={toggleNumber}
              disabled={!isOpen || Boolean(reservation)}
            />
            <Stack direction="row" justifyContent="space-between">
              <Stack>
                <Typography variant="caption" color="text.secondary">
                  Seleccionados
                </Typography>
                <Typography variant="h6">{selectedNumbers.length}</Typography>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6">{formatMoney(totalSelected, raffle.currency)}</Typography>
              </Stack>
            </Stack>
            {reservation && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">Reserva activa</Typography>
                  <Chip label={timeLeft || "00:00"} color="warning" />
                </Stack>
              </Paper>
            )}
            {purchaseError && <Alert severity="error">{purchaseError}</Alert>}
            {!reservation && (
              <Button variant="contained" onClick={handleReserve} disabled={!isOpen || processing}>
                {processing ? "Reservando..." : "Reservar numeros"}
              </Button>
            )}
            {reservation && !purchase && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="outlined" onClick={handleRelease} disabled={processing}>
                  Cancelar reserva
                </Button>
                <Button variant="contained" onClick={handleConfirm} disabled={processing}>
                  {processing ? "Confirmando..." : "Confirmar compra"}
                </Button>
              </Stack>
            )}
            {purchase && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Compra completada</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estos numeros quedan guardados para el sorteo.
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" spacing={1}>
                    {purchase.numbers.map((number) => (
                      <Chip key={number} label={number} />
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Total pagado
                    </Typography>
                    <Typography variant="subtitle2">
                      {formatMoney(purchase.total_price, purchase.currency)}
                    </Typography>
                  </Stack>
                  <Button variant="text" href="/purchases">
                    Ver mis compras
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>
      </Grid>

      <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="sm">
        <DialogTitle>Eliminar rifa</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Esta accion no se puede deshacer. Para confirmar, escribe el titulo exacto de la rifa:
            </Typography>
            <Typography variant="subtitle2">{raffle.title}</Typography>
            <TextField
              label="Escribe el titulo para confirmar"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              fullWidth
              autoFocus
            />
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={closeDelete} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting || deleteInput !== raffle.title}
          >
            {deleting ? "Eliminando..." : "Eliminar definitivamente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default RaffleDetailPage;
