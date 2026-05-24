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
          boxShadow: "0 12px 24px rgba(243, 107, 79, 0.25)",
          color: "#fff",
          fontWeight: 800,
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: -size / 2,
            right: -size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
          },
        }}
      >
        <Typography component="span" variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 800, position: "relative", zIndex: 1 }}>
          R
        </Typography>
      </Box>
      <Box>
        <Typography variant={compact ? "subtitle1" : "h6"} sx={{ lineHeight: 1.1, fontWeight: 800 }}>
          RifaApp
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default Brand;
