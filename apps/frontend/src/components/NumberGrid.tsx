import { Box, ButtonBase, Typography, useTheme } from "@mui/material";

import type { RaffleNumber } from "../types";

type NumberGridProps = {
  numbers: RaffleNumber[];
  selectedNumbers: number[];
  onToggle: (value: number) => void;
  disabled?: boolean;
  reservedNumbers?: number[];
};

const NumberGrid = ({ numbers, selectedNumbers, onToggle, disabled, reservedNumbers = [] }: NumberGridProps) => {
  const theme = useTheme();
  const selectedSet = new Set(selectedNumbers);
  const reservedSet = new Set(reservedNumbers);

  const statusStyles = {
    available: {
      borderColor: "rgba(28, 31, 38, 0.10)",
      color: "text.primary",
      backgroundColor: "background.paper",
      hoverBg: "rgba(47, 180, 154, 0.08)",
      hoverBorder: "rgba(47, 180, 154, 0.3)",
    },
    reserved: {
      borderColor: "rgba(244, 161, 79, 0.35)",
      color: "warning.main",
      backgroundColor: "rgba(244, 161, 79, 0.06)",
      hoverBg: "rgba(244, 161, 79, 0.06)",
      hoverBorder: "rgba(244, 161, 79, 0.35)",
    },
    sold: {
      borderColor: "rgba(204, 75, 75, 0.25)",
      color: "error.main",
      backgroundColor: "rgba(204, 75, 75, 0.05)",
      hoverBg: "rgba(204, 75, 75, 0.05)",
      hoverBorder: "rgba(204, 75, 75, 0.25)",
    },
  };

  return (
    <Box
      role="grid"
      aria-label="Selector de numeros"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
        gap: 1,
        mt: 1,
      }}
    >
      {numbers.map((item) => {
        const isSelected = selectedSet.has(item.number);
        const isReservedByUser = reservedSet.has(item.number);
        const isDisabled = disabled || item.status !== "available";
        const baseStyle = statusStyles[item.status];

        return (
          <ButtonBase
            key={item.number}
            type="button"
            onClick={() => onToggle(item.number)}
            disabled={isDisabled}
            role="gridcell"
            aria-pressed={isSelected}
            sx={{
              height: 52,
              borderRadius: 2.5,
              border: "1.5px solid",
              borderColor: isSelected ? "primary.main" : baseStyle.borderColor,
              bgcolor: isSelected
                ? "primary.main"
                : isReservedByUser
                ? "rgba(47, 180, 154, 0.08)"
                : baseStyle.backgroundColor,
              color: isSelected ? "#fff" : isReservedByUser ? "secondary.main" : baseStyle.color,
              fontWeight: 700,
              fontSize: "0.85rem",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: isSelected ? "0 6px 20px rgba(243, 107, 79, 0.25)" : "none",
              position: "relative",
              outline: isReservedByUser && !isSelected ? `2px solid ${theme.palette.secondary.main}` : "none",
              outlineOffset: isReservedByUser && !isSelected ? 1 : 0,
              "&:hover": {
                transform: isDisabled ? "none" : "translateY(-2px) scale(1.02)",
                bgcolor: isSelected
                  ? "primary.dark"
                  : isReservedByUser
                  ? "rgba(47, 180, 154, 0.12)"
                  : baseStyle.hoverBg,
                borderColor: isSelected ? "primary.dark" : baseStyle.hoverBorder,
                boxShadow: isDisabled ? "none" : "0 4px 12px rgba(18, 22, 33, 0.08)",
              },
              "&:active": {
                transform: isDisabled ? "none" : "translateY(0) scale(0.98)",
              },
              "&.Mui-disabled": {
                opacity: 0.4,
                cursor: "not-allowed",
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {item.label}
            </Typography>
            {isSelected && (
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                }}
              />
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default NumberGrid;
