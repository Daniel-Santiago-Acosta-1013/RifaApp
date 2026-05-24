import type { MouseEvent } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import { useApp } from "../context/AppContext";

const ModeSwitch = () => {
  const { mode, setMode } = useApp();

  const handleChange = (_event: MouseEvent<HTMLElement>, nextMode: "buy" | "sell" | null) => {
    if (nextMode) {
      setMode(nextMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label="Selecciona modo"
      sx={{
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.7)",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 999,
        padding: 0.4,
        gap: 0.5,
        "& .MuiToggleButton-root": {
          flex: 1,
          border: "none",
          borderRadius: 999,
          fontWeight: 700,
          px: 2,
          py: 0.5,
          textTransform: "none",
        },
        "& .MuiToggleButton-root.Mui-selected": {
          boxShadow: "0 12px 24px rgba(18, 22, 33, 0.12)",
          backgroundColor: "#fff",
        },
      }}
    >
      <ToggleButton value="buy" aria-label="Comprar">
        Comprar
      </ToggleButton>
      <ToggleButton value="sell" aria-label="Vender">
        Vender
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ModeSwitch;
