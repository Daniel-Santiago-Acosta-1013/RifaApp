import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { depositWallet, getWallet, resetWallet } from "../api/client";
import type { Wallet, WalletPaymentMethod } from "../types";
import { useAuth } from "./AuthContext";

type Mode = "buy" | "sell";

type AppContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  wallet: Wallet;
  balance: number;
  transactions: Wallet["transactions"];
  walletLoading: boolean;
  walletError: string;
  refreshWallet: () => Promise<Wallet | null>;
  deposit: (amount: number, method: WalletPaymentMethod) => Promise<Wallet | null>;
  resetBalance: () => Promise<Wallet | null>;
};

const MODE_KEY = "rifaapp_mode";

const emptyWallet = (): Wallet => ({
  user_id: "",
  balance: "0",
  currency: "COP",
  transactions: [],
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
});

const loadMode = (): Mode => {
  if (typeof window === "undefined") {
    return "buy";
  }
  const raw = localStorage.getItem(MODE_KEY);
  return raw === "sell" ? "sell" : "buy";
};

const parseBalance = (value: string | number) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : 0;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [mode, updateMode] = useState<Mode>(() => loadMode());
  const [wallet, updateWallet] = useState<Wallet>(() => emptyWallet());
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  const setMode = (next: Mode) => {
    updateMode(next);
    localStorage.setItem(MODE_KEY, next);
  };

  const refreshWallet = useCallback(async () => {
    if (!user) {
      updateWallet(emptyWallet());
      setWalletError("");
      return null;
    }
    setWalletLoading(true);
    setWalletError("");
    try {
      const response = await getWallet();
      updateWallet(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar la billetera.";
      setWalletError(message);
      return null;
    } finally {
      setWalletLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      updateWallet(emptyWallet());
      setWalletError("");
      return;
    }
    let active = true;
    setWalletLoading(true);
    setWalletError("");
    getWallet()
      .then((response) => {
        if (active) {
          updateWallet(response);
        }
      })
      .catch((err) => {
        if (active) {
          setWalletError(err instanceof Error ? err.message : "No se pudo cargar la billetera.");
        }
      })
      .finally(() => {
        if (active) {
          setWalletLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const deposit = useCallback(async (amount: number, method: WalletPaymentMethod) => {
    setWalletLoading(true);
    setWalletError("");
    try {
      const response = await depositWallet({ amount, currency: "COP", method });
      updateWallet(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo ingresar dinero.";
      setWalletError(message);
      throw err;
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const resetBalance = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");
    try {
      const response = await resetWallet();
      updateWallet(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo vaciar la billetera.";
      setWalletError(message);
      throw err;
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      wallet,
      balance: parseBalance(wallet.balance),
      transactions: wallet.transactions,
      walletLoading,
      walletError,
      refreshWallet,
      deposit,
      resetBalance,
    }),
    [deposit, mode, refreshWallet, resetBalance, wallet, walletError, walletLoading],
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
