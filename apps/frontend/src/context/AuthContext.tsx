import React, { createContext, useContext, useMemo, useState } from "react";

import { loginUser, registerUser } from "../api/client";
import type { User } from "../types";

const STORAGE_KEY = "rifaapp_user";

const loadStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const persistUser = (user: User | null) => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    setUser(response);
    persistUser(response);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await registerUser({ name, email, password });
    setUser(response);
    persistUser(response);
  };

  const logout = () => {
    setUser(null);
    persistUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
