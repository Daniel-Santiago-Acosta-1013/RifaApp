import { Button, Paper, Stack, Typography } from "@mui/material";

const NotFoundPage = () => (
  <Stack spacing={3} sx={{ maxWidth: 520, mx: "auto" }}>
    <Paper sx={{ p: 4, borderRadius: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4">Pagina no encontrada</Typography>
        <Typography variant="body2" color="text.secondary">
          La ruta que buscas no existe o fue movida.
        </Typography>
        <Button variant="contained" href="/">
          Volver al inicio
        </Button>
      </Stack>
    </Paper>
  </Stack>
);

export default NotFoundPage;
