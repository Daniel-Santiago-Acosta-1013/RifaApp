import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AccountBalanceWallet,
  AddCard,
  ArrowBack,
  CheckCircle,
  CreditCard,
  History,
  InfoOutlined,
  Input,
  Payments,
  RestartAlt,
  Savings,
  Smartphone,
} from "@mui/icons-material";
import { Alert, Box, Button, Chip, Container, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import type { WalletPaymentMethod, WalletTransaction } from "../types";
import { formatDate, formatMoney } from "../utils/format";

const MIN_DEPOSIT = 5000;
const MAX_DEPOSIT = 1000000;
const MOVEMENTS_PAGE_SIZE = 3;

const quickAmounts = [20000, 50000, 100000, 200000];

const depositMethods: Array<{
  id: WalletPaymentMethod;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "pse_demo",
    label: "PSE demo",
    description: "Aprobacion inmediata",
    icon: <Payments />,
  },
  {
    id: "nequi_demo",
    label: "Nequi demo",
    description: "Numero simulado",
    icon: <Smartphone />,
  },
  {
    id: "card_demo",
    label: "Tarjeta demo",
    description: "Sin datos reales",
    icon: <CreditCard />,
  },
];

const methodLabel = (method?: WalletTransaction["method"] | WalletPaymentMethod) => {
  if (method === "wallet_demo") return "Billetera demo";
  const match = depositMethods.find((item) => item.id === method);
  return match?.label || "Billetera demo";
};

const transactionSign = (type: WalletTransaction["type"]) => {
  if (type === "deposit" || type === "refund") return "+";
  return "-";
};

const transactionColor = (type: WalletTransaction["type"]) => {
  if (type === "deposit" || type === "refund") return "secondary.main";
  if (type === "reset") return "text.secondary";
  return "primary.main";
};

const sanitizeReturnTo = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
};

const roundDepositAmount = (value: number) => Math.ceil(value / 1000) * 1000;

const parseDepositAmountInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return String(Number(digits));
};

const formatDepositAmountInput = (value: string) => {
  if (!value) return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? formatMoney(numeric) : "";
};

const surfaceSx = {
  border: "1px solid",
  borderColor: "rgba(230,225,216,0.95)",
  boxShadow: "0 18px 46px rgba(28,31,38,0.07)",
};

const WalletPage = () => {
  const { user } = useAuth();
  const { balance, deposit, resetBalance, transactions, walletError, walletLoading } = useApp();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedAmount = Number(params.get("amount"));
  const returnTo = sanitizeReturnTo(params.get("returnTo"));
  const initialAmount = Number.isFinite(requestedAmount) && requestedAmount > 0 ? roundDepositAmount(requestedAmount) : 50000;

  const [amount, setAmount] = useState(String(initialAmount));
  const [selectedMethod, setSelectedMethod] = useState<WalletPaymentMethod>("pse_demo");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [movementsPage, setMovementsPage] = useState(1);

  const movementPageCount = Math.max(1, Math.ceil(transactions.length / MOVEMENTS_PAGE_SIZE));
  const currentMovementsPage = Math.min(movementsPage, movementPageCount);
  const visibleTransactions = useMemo(() => {
    const start = (currentMovementsPage - 1) * MOVEMENTS_PAGE_SIZE;
    return transactions.slice(start, start + MOVEMENTS_PAGE_SIZE);
  }, [currentMovementsPage, transactions]);
  const movementStart = transactions.length === 0 ? 0 : (currentMovementsPage - 1) * MOVEMENTS_PAGE_SIZE + 1;
  const movementEnd = Math.min(currentMovementsPage * MOVEMENTS_PAGE_SIZE, transactions.length);

  useEffect(() => {
    if (Number.isFinite(requestedAmount) && requestedAmount > 0) {
      setAmount(String(roundDepositAmount(requestedAmount)));
    }
  }, [requestedAmount]);

  useEffect(() => {
    setMovementsPage((page) => Math.min(page, movementPageCount));
  }, [movementPageCount]);

  if (!user) {
    return (
      <Onboarding
        title="Activa tu billetera demo"
        subtitle="Inicia sesion para ingresar saldo simulado y comprar rifas."
      />
    );
  }

  const numericAmount = Number(amount);
  const hasValidAmount =
    Number.isFinite(numericAmount) && numericAmount >= MIN_DEPOSIT && numericAmount <= MAX_DEPOSIT;
  const projectedBalance = hasValidAmount ? balance + numericAmount : balance;
  const selectedMethodLabel = methodLabel(selectedMethod);

  const handleDeposit = async () => {
    if (!hasValidAmount) {
      setFeedback({
        type: "error",
        message: `Ingresa un monto entre ${formatMoney(MIN_DEPOSIT)} y ${formatMoney(MAX_DEPOSIT)}.`,
      });
      return;
    }

    try {
      await deposit(numericAmount, selectedMethod);
      setFeedback({
        type: "success",
        message: `Recarga demo aprobada por ${formatMoney(numericAmount)}.`,
      });
      setAmount("50000");
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "No se pudo ingresar dinero.",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetBalance();
      setFeedback({
        type: "success",
        message: "Billetera demo vaciada.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "No se pudo vaciar la billetera.",
      });
    }
  };

  return (
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={{ xs: 2.5, md: 3.5 }} sx={{ pb: { xs: 2, sm: 0 } }}>
      <PageHeader
        eyebrow="Billetera demo"
        title="Saldo para comprar rifas"
        subtitle="Ingresa saldo simulado en COP y usalo al confirmar tus reservas."
      />

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ borderRadius: 3 }}
          action={
            returnTo && feedback.type === "success" ? (
              <Button component={Link} to={returnTo} color="inherit" size="small" startIcon={<ArrowBack />}>
                Volver a la rifa
              </Button>
            ) : undefined
          }
        >
          {feedback.message}
        </Alert>
      )}

      {walletError && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {walletError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
          gap: { xs: 2, md: 2.5 },
          alignItems: "start",
        }}
      >
        <Paper
          sx={{
            ...surfaceSx,
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            overflow: "hidden",
            color: "#fff",
            background: "linear-gradient(135deg, #1C1F26 0%, #2B3039 58%, #17463C 100%)",
          }}
        >
          <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: alpha("#ffffff", 0.12),
                  color: "primary.light",
                }}
              >
                <Savings />
              </Box>
              <Chip
                label="Demo"
                size="small"
                sx={{
                  color: "secondary.light",
                  borderColor: alpha("#8FE2D3", 0.55),
                  backgroundColor: alpha("#8FE2D3", 0.08),
                }}
                variant="outlined"
              />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.72) }}>
                Disponible
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: "3rem", sm: "3.4rem" }, color: "#fff" }}>
                {formatMoney(balance, "COP")}
              </Typography>
            </Stack>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha("#ffffff", 0.09),
                border: `1px solid ${alpha("#ffffff", 0.14)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.62) }}>
                Cuenta
              </Typography>
              <Typography
                variant="body1"
                fontWeight={800}
                sx={{ mt: 0.5, wordBreak: "break-word", color: "#fff" }}
              >
                {user.email}
              </Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.2 }}>
              {[
                ["Moneda", "COP"],
                ["Estado", "Activa"],
              ].map(([label, value]) => (
                <Box key={label} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: alpha("#ffffff", 0.58) }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: "#fff" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<RestartAlt />}
              disabled={walletLoading || balance === 0}
              sx={{
                alignSelf: "flex-start",
                color: "#fff",
                borderColor: alpha("#ffffff", 0.28),
                backgroundColor: alpha("#ffffff", 0.04),
                "&:hover": {
                  borderColor: alpha("#ffffff", 0.45),
                  backgroundColor: alpha("#ffffff", 0.08),
                },
                "&.Mui-disabled": {
                  color: alpha("#ffffff", 0.36),
                  borderColor: alpha("#ffffff", 0.16),
                },
              }}
            >
              Vaciar billetera demo
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ ...surfaceSx, p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={{ xs: 2.5, md: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: "primary.main",
                  backgroundColor: "rgba(243,107,79,0.1)",
                }}
              >
                <AccountBalanceWallet />
              </Box>
              <Box>
                <Typography variant="h6">Ingresar dinero</Typography>
                <Typography variant="body2" color="text.secondary">
                  Recarga simulada con aprobacion inmediata.
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              {quickAmounts.map((value) => (
                <Chip
                  key={value}
                  label={`+${formatMoney(value, "COP")}`}
                  onClick={() => {
                    setAmount(String(value));
                    setFeedback(null);
                  }}
                  disabled={walletLoading}
                  color={Number(amount) === value ? "primary" : "default"}
                  variant={Number(amount) === value ? "filled" : "outlined"}
                  sx={{ width: "100%", height: 36, fontSize: { xs: "0.78rem", sm: "0.82rem" } }}
                />
              ))}
            </Box>

            <TextField
              label="Monto a ingresar"
              type="text"
              value={formatDepositAmountInput(amount)}
              onChange={(event) => {
                setAmount(parseDepositAmountInput(event.target.value));
                setFeedback(null);
              }}
              inputProps={{ inputMode: "numeric" }}
              error={amount !== "" && !hasValidAmount}
              helperText={`Minimo ${formatMoney(MIN_DEPOSIT)}. Maximo ${formatMoney(MAX_DEPOSIT)}.`}
              fullWidth
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              {depositMethods.map((method) => {
                const selected = selectedMethod === method.id;
                return (
                <Button
                  key={method.id}
                  variant="outlined"
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={walletLoading}
                  startIcon={method.icon}
                  sx={{
                    justifyContent: "flex-start",
                    alignItems: "center",
                    borderRadius: 2,
                    py: 1.35,
                    px: 1.5,
                    minHeight: 74,
                    color: selected ? "primary.contrastText" : "text.primary",
                    borderColor: selected ? "primary.main" : "divider",
                    backgroundColor: selected ? "primary.main" : "background.paper",
                    "& .MuiButton-startIcon": {
                      color: selected ? "primary.contrastText" : "primary.main",
                    },
                    "&:hover": {
                      borderColor: selected ? "primary.dark" : "primary.main",
                      backgroundColor: selected ? "primary.dark" : "rgba(243,107,79,0.05)",
                    },
                  }}
                >
                  <Stack spacing={0} alignItems="flex-start" sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                      {method.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: selected ? alpha("#ffffff", 0.82) : "text.secondary",
                        lineHeight: 1.25,
                        whiteSpace: "normal",
                      }}
                    >
                      {method.description}
                    </Typography>
                  </Stack>
                </Button>
                );
              })}
            </Box>

            <Box
              sx={{
                p: { xs: 2, sm: 2.4 },
                borderRadius: 2,
                backgroundColor: "rgba(47,180,154,0.07)",
                border: "1px solid rgba(47,180,154,0.18)",
              }}
            >
              <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Metodo
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedMethodLabel}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Recarga
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {hasValidAmount ? formatMoney(numericAmount, "COP") : "-"}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Saldo final
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="secondary.main">
                    {formatMoney(projectedBalance, "COP")}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleDeposit}
              startIcon={<AddCard />}
              disabled={walletLoading}
              sx={{
                borderRadius: 999,
                alignSelf: { xs: "stretch", sm: "flex-end" },
                px: { xs: 2.5, sm: 4 },
                minHeight: 52,
              }}
            >
              {walletLoading ? "Procesando..." : "Confirmar recarga demo"}
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Paper sx={{ ...surfaceSx, p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: "primary.main",
                backgroundColor: "rgba(243,107,79,0.1)",
              }}
            >
              <History />
            </Box>
            <Box>
              <Typography variant="h6">Movimientos</Typography>
              <Typography variant="body2" color="text.secondary">
                Ultimas operaciones de la billetera.
              </Typography>
            </Box>
          </Stack>

          {transactions.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: { xs: 2, sm: 2.4 },
                borderRadius: 2,
                color: "info.main",
                backgroundColor: "rgba(91,124,250,0.08)",
                border: "1px solid rgba(91,124,250,0.12)",
              }}
            >
              <InfoOutlined fontSize="small" />
              <Typography variant="body2" color="text.primary">
                Aun no hay movimientos.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.2}>
              {visibleTransactions.map((transaction) => (
                <Box
                  key={transaction.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
                    gap: { xs: 1.5, sm: 2 },
                    alignItems: "center",
                    p: { xs: 1.8, sm: 2 },
                    borderRadius: 2,
                    border: "1px solid rgba(239,231,220,0.8)",
                    backgroundColor: "rgba(255,252,248,0.72)",
                  }}
                >
                  <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color:
                          transaction.type === "deposit" || transaction.type === "refund"
                            ? "secondary.main"
                            : "primary.main",
                        backgroundColor:
                          transaction.type === "deposit" || transaction.type === "refund"
                            ? "rgba(47,180,154,0.1)"
                            : "rgba(243,107,79,0.1)",
                      }}
                    >
                      {transaction.type === "deposit" || transaction.type === "refund" ? <Input /> : <Payments />}
                    </Box>
                    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                        {transaction.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {methodLabel(transaction.method)} - {formatDate(transaction.created_at)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack spacing={0.2} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                    <Typography variant="body1" fontWeight={900} color={transactionColor(transaction.type)}>
                      {transactionSign(transaction.type)}
                      {formatMoney(transaction.amount, transaction.currency)}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <CheckCircle sx={{ fontSize: 15, color: "secondary.main" }} />
                      <Typography variant="caption" color="text.secondary">
                        Completado
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ))}
              {movementPageCount > 1 && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                  sx={{ pt: 0.5 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Mostrando {movementStart}-{movementEnd} de {transactions.length}
                  </Typography>
                  <Pagination
                    count={movementPageCount}
                    page={currentMovementsPage}
                    onChange={(_, page) => setMovementsPage(page)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={0}
                    boundaryCount={1}
                    sx={{
                      alignSelf: { xs: "center", sm: "auto" },
                      "& .MuiPagination-ul": {
                        justifyContent: "center",
                      },
                    }}
                  />
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default WalletPage;
