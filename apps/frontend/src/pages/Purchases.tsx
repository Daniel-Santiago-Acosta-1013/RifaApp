import { useEffect, useState } from "react";
import { Alert, Button, Card, CardActions, CardContent, Chip, Paper, Stack, Typography } from "@mui/material";

import { listPurchases } from "../api/client";
import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import type { Purchase } from "../types";
import { formatDate, formatMoney } from "../utils/format";
import { getParticipantId } from "../utils/participants";

const PurchasesPage = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const participantId = getParticipantId(user.email);
    if (!participantId) {
      setPurchases([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    listPurchases(participantId)
      .then((data) => {
        setPurchases(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar compras");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <Onboarding
        title="Inicia sesion para ver tus compras"
        subtitle="Necesitas una cuenta para consultar tus numeros reservados."
      />
    );
  }

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Mis compras"
        title="Tus numeros y comprobantes demo"
        subtitle="Historial completo de compras simuladas."
      />

      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Cargando compras...
          </Typography>
        </Paper>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : purchases.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Aun no tienes compras registradas.{" "}
            <Button size="small" href="/">
              Explorar rifas
            </Button>
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {purchases.map((purchase) => (
            <Card key={purchase.purchase_id}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ md: "center" }}
                >
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      Compra demo
                    </Typography>
                    <Typography variant="h6">{purchase.raffle_title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estado rifa: {purchase.raffle_status}
                    </Typography>
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h6">{formatMoney(purchase.total_price, purchase.currency)}</Typography>
                  </Paper>
                </Stack>
                <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
                  {purchase.numbers.map((number) => (
                    <Chip key={number} label={number} />
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Metodo: {purchase.payment_method || "Demo"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(purchase.created_at)}
                  </Typography>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button size="small" variant="outlined" href={`/raffles/${purchase.raffle_id}`}>
                  Ver rifa
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default PurchasesPage;
