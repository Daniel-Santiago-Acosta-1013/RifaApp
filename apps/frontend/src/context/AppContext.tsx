import React, { createContext, useContext, useMemo, useState } from "react";

type Mode = "buy" | "sell";

type AppContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  balance: number;
  credit: (amount: number) => void;
  debit: (amount: number) => boolean;
  resetBalance: () => void;
};

const MODE_KEY = "rifaapp_mode";
const BALANCE_KEY = "rifaapp_demo_balance";
const DEFAULT_BALANCE = 150000;

const loadMode = (): Mode => {
  if (typeof window === "undefined") {
    return "buy";
  }
  const raw = localStorage.getItem(MODE_KEY);
  return raw === "sell" ? "sell" : "buy";
};

const loadBalance = (): number => {
  if (typeof window === "undefined") {
    return DEFAULT_BALANCE;
  }
  const raw = localStorage.getItem(BALANCE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_BALANCE;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, updateMode] = useState<Mode>(() => loadMode());
  const [balance, updateBalance] = useState<number>(() => loadBalance());

  const setMode = (next: Mode) => {
    updateMode(next);
    localStorage.setItem(MODE_KEY, next);
  };

  const credit = (amount: number) => {
    updateBalance((prev) => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem(BALANCE_KEY, String(next));
      return next;
    });
  };

  const debit = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }
    if (balance < amount) {
      return false;
    }
    updateBalance((prev) => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem(BALANCE_KEY, String(next));
      return next;
    });
    return true;
  };

  const resetBalance = () => {
    updateBalance(DEFAULT_BALANCE);
    localStorage.setItem(BALANCE_KEY, String(DEFAULT_BALANCE));
  };

  const value = useMemo(
    () => ({
      mode,
      setMode,
      balance,
      credit,
      debit,
      resetBalance,
    }),
    [mode, balance],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
