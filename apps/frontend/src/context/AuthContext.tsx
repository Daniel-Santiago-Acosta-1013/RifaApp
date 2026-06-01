import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { ApiError, getCurrentUser, loginUser, registerUser } from "../api/client";
import {
  changePasswordWithCognito,
  confirmForgotPasswordWithCognito,
  confirmSignUpWithCognito,
  forgotPasswordWithCognito,
  getCurrentIdToken,
  isCognitoConfigured,
  resendSignUpCodeWithCognito,
  signInWithCognito,
  signOutFromCognito,
  signUpWithCognito,
} from "../auth/cognito";
import { setAuthTokenProvider } from "../auth/token";
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

export type AuthError = {
  message: string;
  status?: number;
  code?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: AuthError }>;
  confirmRegistration: (email: string, code: string) => Promise<{ success: boolean; error?: AuthError }>;
  resendRegistrationCode: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  resetPassword: (email: string, code: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => (isCognitoConfigured ? null : loadStoredUser()));
  const [loading, setLoading] = useState(isCognitoConfigured);

  useEffect(() => {
    setAuthTokenProvider(isCognitoConfigured ? getCurrentIdToken : null);
    if (!isCognitoConfigured) {
      return;
    }
    let active = true;
    getCurrentUser()
      .then((response) => {
        if (active) {
          setUser(response);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const normalizeError = (err: unknown, fallback = "Error de conexion. Intenta de nuevo."): AuthError => {
    if (err instanceof ApiError) {
      return { message: err.message, status: err.status };
    }
    if (err instanceof Error) {
      const code = (err as Error & { code?: string; name?: string }).code || (err as Error & { name?: string }).name;
      return { message: err.message || fallback, code };
    }
    return { message: fallback, status: 0 };
  };

  const syncCurrentUser = async () => {
    const response = await getCurrentUser();
    setUser(response);
    return response;
  };

  const login = async (email: string, password: string) => {
    try {
      if (isCognitoConfigured) {
        await signInWithCognito(email, password);
        await syncCurrentUser();
        return { success: true };
      }
      const response = await loginUser({ email, password });
      setUser(response);
      persistUser(response);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      if (isCognitoConfigured) {
        await signUpWithCognito(name, email, password);
        return { success: true, needsConfirmation: true };
      }
      const response = await registerUser({ name, email, password });
      setUser(response);
      persistUser(response);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const confirmRegistration = async (email: string, code: string) => {
    try {
      await confirmSignUpWithCognito(email, code);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const resendRegistrationCode = async (email: string) => {
    try {
      await resendSignUpCodeWithCognito(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await forgotPasswordWithCognito(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const resetPassword = async (email: string, code: string, password: string) => {
    try {
      await confirmForgotPasswordWithCognito(email, code, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await changePasswordWithCognito(oldPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: normalizeError(err) };
    }
  };

  const logout = () => {
    if (isCognitoConfigured) {
      signOutFromCognito();
    }
    setUser(null);
    persistUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      confirmRegistration,
      resendRegistrationCode,
      forgotPassword,
      resetPassword,
      changePassword,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
