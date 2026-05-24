import { Box, Stack, Typography, useTheme } from "@mui/material";

type BrandProps = {
  subtitle?: string;
  compact?: boolean;
};

const Brand = ({ subtitle, compact }: BrandProps) => {
  const theme = useTheme();
  const size = compact ? 36 : 44;

  return (
    <Stack direction="row" spacing={compact ? 1.5 : 2} alignItems="center">
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: compact ? 2.5 : 3,
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          boxShadow: "0 16px 30px rgba(243, 107, 79, 0.3)",
          color: "#fff",
          fontWeight: 800,
        }}
      >
        <Typography component="span" variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 800 }}>
          R
        </Typography>
      </Box>
      <Box>
        <Typography variant={compact ? "subtitle1" : "h6"} sx={{ lineHeight: 1.1 }}>
          RifaApp
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default Brand;
