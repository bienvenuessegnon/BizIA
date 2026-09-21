"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "@/services/auth";
import type { LoginPayload, SignupPayload, User } from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleAccount: (profile: { email: string; name?: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .restoreSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setIsLoading(false));
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const session = await authService.signup(payload);
    setUser(session.user);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await authService.login(payload);
    setUser(session.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const session = await authService.loginWithGoogle();
    setUser(session.user);
  }, []);

  const loginWithGoogleAccount = useCallback(async (profile: { email: string; name?: string }) => {
    const session = await authService.loginWithGoogleAccount(profile);
    setUser(session.user);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return await authService.requestPasswordReset(email);
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    return await authService.resetPassword(email, newPassword);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signup,
      login,
      loginWithGoogle,
      loginWithGoogleAccount,
      requestPasswordReset,
      resetPassword,
      logout,
    }),
    [
      user,
      isLoading,
      signup,
      login,
      loginWithGoogle,
      loginWithGoogleAccount,
      requestPasswordReset,
      resetPassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }
  return ctx;
}
