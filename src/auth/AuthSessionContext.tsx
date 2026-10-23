import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { RegisterResponse } from "../api/auth";
import { secureStorage } from "../storage/secureStorage";

type SessionUser = RegisterResponse["user"];

type ContextValue = {
  isAuthenticated: boolean;
  user: SessionUser | null;
  accessToken: string | null;
  establishSession: (response: RegisterResponse) => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthSessionContext = createContext<ContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const establishSession = useCallback(async (response: RegisterResponse) => {
    setUser(response.user);
    setAccessToken(response.tokens.accessToken);
    await secureStorage.setRefreshToken(response.tokens.refreshToken);
  }, []);

  const clearSession = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    await secureStorage.clearRefreshToken();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user && accessToken),
      user,
      accessToken,
      establishSession,
      clearSession,
    }),
    [user, accessToken, establishSession, clearSession],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): ContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}
