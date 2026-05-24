import { Bolt, FactCheck, Storefront } from "@mui/icons-material";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

import Brand from "./Brand";

const features = [
  {
    title: "Numeros claros",
    description: "Grid ordenado con formatos 00-99 o 000-999 para que siempre sepas cuales quedan.",
    icon: <FactCheck />,
    gradient: "linear-gradient(135deg, rgba(47,180,154,0.12), rgba(143,226,211,0.2))",
    color: "#2FB49A",
  },
  {
    title: "Reserva temporal",
    description: "Aparta numeros por minutos mientras confirmas tu compra. Sin sorpresas.",
    icon: <Bolt />,
    gradient: "linear-gradient(135deg, rgba(243,107,79,0.12), rgba(255,176,137,0.2))",
    color: "#F36B4F",
  },
  {
    title: "Modo vendedor",
    description: "Crea y controla rifas desde un panel limpio y sin complicaciones.",
    icon: <Storefront />,
    gradient: "linear-gradient(135deg, rgba(91,124,250,0.12), rgba(155,177,255,0.2))",
    color: "#5B7CFA",
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
  <Box
    component="section"
    sx={{
      py: { xs: 5, md: 8 },
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(243,107,79,0.06), transparent 70%)",
        pointerEvents: "none",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        bottom: -80,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(47,180,154,0.06), transparent 70%)",
        pointerEvents: "none",
      },
    }}
  >
    <Container maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 5,
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 252, 248, 0.9))",
          border: "1px solid rgba(239, 231, 220, 0.8)",
          boxShadow: "0 24px 64px rgba(18, 22, 33, 0.08)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Brand subtitle="Rifas colombianas en modo demo." />

          <Stack spacing={1.5} maxWidth={480}>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
              {title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              href="/register"
              sx={{ px: 4, py: 1.2, borderRadius: 999 }}
            >
              Crear cuenta
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/login"
              sx={{ px: 4, py: 1.2, borderRadius: 999 }}
            >
              Ya tengo cuenta
            </Button>
          </Stack>

          <Stack spacing={2.5} width="100%">
            {features.map((item) => (
              <Stack
                key={item.title}
                direction="row"
                spacing={2.5}
                sx={{
                  p: 2.5,
                  borderRadius: 3.5,
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid rgba(231, 222, 210, 0.6)",
                  transition: "all 0.3s ease",
                  textAlign: "left",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(18, 22, 33, 0.06)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background: item.gradient,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {note}
          </Typography>
        </Stack>
      </Paper>
    </Container>
  </Box>
);

export default Onboarding;
