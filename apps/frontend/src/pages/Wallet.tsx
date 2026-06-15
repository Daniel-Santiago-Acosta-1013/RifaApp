import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AccountBalanceWallet,
  AddCard,
  ArrowBack,
  CheckCircle,
  CreditCard,
  History,
  Payments,
  RestartAlt,
  Savings,
  Smartphone,
} from "@mui/icons-material";
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";

import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import type { WalletPaymentMethod, WalletTransaction } from "../types";
import { formatDate, formatMoney } from "../utils/format";

const MIN_DEPOSIT = 5000;
const MAX_DEPOSIT = 1000000;

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

  useEffect(() => {
    if (Number.isFinite(requestedAmount) && requestedAmount > 0) {
      setAmount(String(roundDepositAmount(requestedAmount)));
    }
  }, [requestedAmount]);

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
    <Stack spacing={4}>
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
          gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 0.9fr) minmax(0, 1.1fr)" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid rgba(239,231,220,0.8)" }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Savings color="primary" />
              <Chip label="Demo" size="small" color="secondary" variant="outlined" />
            </Stack>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Disponible
              </Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>
                {formatMoney(balance, "COP")}
              </Typography>
            </Box>
            <Stack spacing={0.75}>
              <Typography variant="body2" color="text.secondary">
                Cuenta
              </Typography>
              <Typography variant="body1" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                {user.email}
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="text"
              color="inherit"
              onClick={handleReset}
              startIcon={<RestartAlt />}
              disabled={walletLoading || balance === 0}
              sx={{ alignSelf: "flex-start" }}
            >
              Vaciar billetera demo
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid rgba(239,231,220,0.8)" }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccountBalanceWallet color="primary" />
              <Box>
                <Typography variant="h6">Ingresar dinero</Typography>
                <Typography variant="body2" color="text.secondary">
                  Recarga simulada con aprobacion inmediata.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                />
              ))}
            </Stack>

            <TextField
              label="Monto a ingresar"
              type="number"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setFeedback(null);
              }}
              inputProps={{ min: MIN_DEPOSIT, max: MAX_DEPOSIT, step: 1000 }}
              error={amount !== "" && !hasValidAmount}
              helperText={`Minimo ${formatMoney(MIN_DEPOSIT)}. Maximo ${formatMoney(MAX_DEPOSIT)}.`}
              fullWidth
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {depositMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? "contained" : "outlined"}
                  color={selectedMethod === method.id ? "primary" : "inherit"}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={walletLoading}
                  startIcon={method.icon}
                  sx={{ justifyContent: "flex-start", borderRadius: 3, py: 1.25 }}
                >
                  <Stack spacing={0} alignItems="flex-start">
                    <Typography variant="body2" fontWeight={800}>
                      {method.label}
                    </Typography>
                    <Typography variant="caption">{method.description}</Typography>
                  </Stack>
                </Button>
              ))}
            </Box>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                backgroundColor: "rgba(47,180,154,0.06)",
                border: "1px solid rgba(47,180,154,0.16)",
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
              sx={{ borderRadius: 999, alignSelf: { xs: "stretch", sm: "flex-end" }, px: 4 }}
            >
              {walletLoading ? "Procesando..." : "Confirmar recarga demo"}
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid rgba(239,231,220,0.8)" }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <History color="primary" />
            <Box>
              <Typography variant="h6">Movimientos</Typography>
              <Typography variant="body2" color="text.secondary">
                Ultimas operaciones de la billetera.
              </Typography>
            </Box>
          </Stack>

          {transactions.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Aun no hay movimientos.
            </Alert>
          ) : (
            <Stack spacing={1.2}>
              {transactions.map((transaction) => (
                <Box
                  key={transaction.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                    gap: 1,
                    alignItems: "center",
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(239,231,220,0.8)",
                  }}
                >
                  <Stack spacing={0.4}>
                    <Typography variant="body2" fontWeight={800}>
                      {transaction.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {methodLabel(transaction.method)} - {formatDate(transaction.created_at)}
                    </Typography>
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
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default WalletPage;
