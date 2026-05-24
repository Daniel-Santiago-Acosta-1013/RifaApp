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
      borderColor: "rgba(28, 31, 38, 0.12)",
      color: "text.primary",
      backgroundColor: "background.paper",
    },
    reserved: {
      borderColor: "rgba(244, 161, 79, 0.4)",
      color: "warning.main",
      backgroundColor: "rgba(244, 161, 79, 0.08)",
    },
    sold: {
      borderColor: "rgba(204, 75, 75, 0.4)",
      color: "error.main",
      backgroundColor: "rgba(204, 75, 75, 0.08)",
    },
  };

  return (
    <Box
      role="grid"
      aria-label="Selector de numeros"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
        gap: 1.2,
        mt: 2,
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
              height: 48,
              borderRadius: 2,
              border: "1px solid",
              borderColor: baseStyle.borderColor,
              bgcolor: baseStyle.backgroundColor,
              color: baseStyle.color,
              fontWeight: 700,
              transition: "all 0.2s ease",
              boxShadow: isSelected ? "0 10px 20px rgba(18, 22, 33, 0.15)" : "none",
              outline: isReservedByUser ? `2px solid ${theme.palette.secondary.main}` : "none",
              outlineOffset: isReservedByUser ? 1 : 0,
              "&:hover": {
                transform: isDisabled ? "none" : "translateY(-1px)",
              },
              "&.Mui-disabled": {
                opacity: 0.5,
              },
            }}
          >
            <Typography variant="body2">{item.label}</Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default NumberGrid;
