import { useState } from "react";
import { Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";

import Onboarding from "../components/Onboarding";
import PageHeader from "../components/PageHeader";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";

const WalletPage = () => {
  const { user } = useAuth();
  const { balance, credit, resetBalance } = useApp();
  const [amount, setAmount] = useState("50000");

  if (!user) {
    return (
      <Onboarding
        title="Activa tu saldo demo"
        subtitle="Inicia sesion para simular compras con saldo de prueba."
      />
    );
  }

  const handleCredit = () => {
    const value = Number(amount);
    if (Number.isFinite(value) && value > 0) {
      credit(value);
      setAmount("50000");
    }
  };

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Saldo demo"
        title="Simula tus compras en COP"
        subtitle="Recarga saldo cuando quieras, sin pasarelas reales."
      />

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Disponible
            </Typography>
            <Typography variant="h4">{formatMoney(balance, "COP")}</Typography>
          </Paper>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-end">
            <TextField
              label="Monto a recargar"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputProps={{ min: 1000, step: 1000 }}
              fullWidth
            />
            <Button variant="contained" onClick={handleCredit}>
              Recargar saldo
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[20000, 50000, 100000].map((value) => (
              <Chip key={value} label={`+${formatMoney(value, "COP")}`} onClick={() => credit(value)} />
            ))}
          </Stack>
          <Button variant="text" color="inherit" onClick={resetBalance}>
            Reiniciar saldo demo
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default WalletPage;
