import { Bolt, FactCheck, Storefront } from "@mui/icons-material";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

import Brand from "./Brand";

const features = [
  {
    title: "Numeros claros",
    description: "Grid ordenado con formatos 00-99 o 000-999.",
    icon: <FactCheck />,
  },
  {
    title: "Reserva temporal",
    description: "Aparta numeros por minutos mientras confirmas.",
    icon: <Bolt />,
  },
  {
    title: "Modo vendedor",
    description: "Crea y controla rifas desde un panel limpio.",
    icon: <Storefront />,
  },
];

type OnboardingProps = {
  title?: string;
  subtitle?: string;
  note?: string;
};

const Onboarding = ({
  title = "Rifas estilo colombiano en modo demo",
  subtitle = "Compra y organiza rifas con saldo simulado en COP.",
  note = "Proyecto educativo: el flujo de compra es simulado.",
}: OnboardingProps) => (
  <Box component="section" sx={{ py: { xs: 4, md: 6 } }}>
    <Container maxWidth="md">
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 252, 248, 0.9))",
        }}
      >
        <Stack spacing={3}>
          <Brand subtitle="Rifas colombianas en modo demo." />
          <Stack spacing={1}>
            <Typography variant="h3">{title}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="contained" size="large" href="/register">
              Crear cuenta
            </Button>
            <Button variant="outlined" size="large" href="/login">
              Ya tengo cuenta
            </Button>
          </Stack>
          <Stack spacing={2}>
            {features.map((item) => (
              <Stack
                key={item.title}
                direction="row"
                spacing={2}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(231, 222, 210, 0.8)",
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "rgba(47, 180, 154, 0.14)",
                    color: "secondary.main",
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {note}
          </Typography>
        </Stack>
      </Paper>
    </Container>
  </Box>
);

export default Onboarding;
