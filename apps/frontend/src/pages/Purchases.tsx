import { useEffect, useState } from "react";
import {
  ArrowForward,
  CalendarMonth,
  ConfirmationNumber,
  CreditCard,
  ReceiptLong,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

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
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <PageHeader
            eyebrow="Mis compras"
            title="Tus numeros y comprobantes demo"
            subtitle="Historial completo de compras simuladas."
          />

          {loading ? (
            <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid rgba(239,231,220,0.8)" }}>
              <Typography variant="body2" color="text.secondary">
                Cargando compras...
              </Typography>
            </Paper>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          ) : purchases.length === 0 ? (
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                border: "1px solid rgba(239,231,220,0.8)",
                textAlign: "center",
              }}
            >
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "rgba(243,107,79,0.1)",
                    color: "primary.main",
                  }}
                >
                  <ReceiptLong sx={{ fontSize: 32 }} />
                </Box>
                <Stack spacing={0.5}>
                  <Typography variant="h6">Aun no tienes compras</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Explora rifas activas y confirma tus primeros numeros.
                  </Typography>
                </Stack>
                <Button variant="contained" href="/" endIcon={<ArrowForward />} sx={{ borderRadius: 999 }}>
                  Explorar rifas
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={2.5}>
              {purchases.map((purchase) => (
                <Paper
                  key={purchase.purchase_id}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3,
                    border: "1px solid rgba(239,231,220,0.85)",
                    background: "linear-gradient(135deg, rgba(255,252,248,0.98), rgba(250,248,244,0.72))",
                    boxShadow: "0 14px 36px rgba(28,31,38,0.05)",
                  }}
                >
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ sm: "flex-start" }}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            backgroundColor: "rgba(47,180,154,0.1)",
                            color: "secondary.main",
                          }}
                        >
                          <ReceiptLong />
                        </Box>
                        <Stack spacing={0.6} sx={{ minWidth: 0 }}>
                          <Typography
                            variant="overline"
                            sx={{ color: "primary.main", fontSize: "0.68rem", letterSpacing: "0.12em" }}
                          >
                            Compra demo
                          </Typography>
                          <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
                            {purchase.raffle_title}
                          </Typography>
                          <Chip
                            label={`Rifa ${purchase.raffle_status}`}
                            size="small"
                            sx={{
                              width: "fit-content",
                              borderRadius: 1.5,
                              backgroundColor: "rgba(28,31,38,0.05)",
                              color: "text.secondary",
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                      </Stack>

                      <Box
                        sx={{
                          px: 2.2,
                          py: 1.5,
                          borderRadius: 2.5,
                          minWidth: { xs: "100%", sm: 148 },
                          textAlign: { xs: "left", sm: "right" },
                          border: "1px solid rgba(239,231,220,0.95)",
                          backgroundColor: "rgba(255,252,248,0.8)",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                          {formatMoney(purchase.total_price, purchase.currency)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <ConfirmationNumber sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>
                        Numeros
                      </Typography>
                      {purchase.numbers.map((number) => (
                        <Chip
                          key={number}
                          label={number}
                          size="small"
                          sx={{
                            borderRadius: 1.5,
                            height: 30,
                            minWidth: 38,
                            fontWeight: 800,
                            backgroundColor: "rgba(243,107,79,0.1)",
                            color: "primary.dark",
                            border: "1px solid rgba(243,107,79,0.18)",
                          }}
                        />
                      ))}
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1.2, sm: 2 }}
                      justifyContent="space-between"
                      alignItems={{ sm: "center" }}
                    >
                      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <CreditCard sx={{ color: "text.secondary", fontSize: 18 }} />
                          <Typography variant="body2" color="text.secondary">
                            Metodo: {purchase.payment_method || "demo"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <CalendarMonth sx={{ color: "text.secondary", fontSize: 18 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(purchase.created_at)}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Button
                        variant="outlined"
                        href={`/raffles/${purchase.raffle_id}`}
                        endIcon={<ArrowForward />}
                        sx={{ borderRadius: 999, alignSelf: { xs: "flex-start", sm: "center" } }}
                      >
                        Ver rifa
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PurchasesPage;
