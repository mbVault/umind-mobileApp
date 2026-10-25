import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAuthSession, refreshSession, type RegisterResponse } from "../api/auth";
import { secureStorage } from "../storage/secureStorage";

type SessionUser = RegisterResponse["user"];

type ContextValue = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: SessionUser | null;
  accessToken: string | null;
  establishSession: (response: RegisterResponse) => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthSessionContext = createContext<ContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    await secureStorage.clearRefreshToken();
  }, []);

  const establishSession = useCallback(async (response: RegisterResponse) => {
    if (!response.tokens?.accessToken || !response.tokens?.refreshToken) {
      throw new Error("Server response missing tokens. Try updating the app or backend.");
    }
    setUser(response.user);
    setAccessToken(response.tokens.accessToken);
    try {
      await secureStorage.setRefreshToken(response.tokens.refreshToken);
    } catch (err) {
      console.warn("[U Mind] Could not persist refresh token:", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const storedRefresh = await secureStorage.getRefreshToken();
        if (!storedRefresh) {
          return;
        }

        const refreshed = await refreshSession(storedRefresh);
        if (cancelled) return;

        await secureStorage.setRefreshToken(refreshed.tokens.refreshToken);
        setAccessToken(refreshed.tokens.accessToken);

        const session = await getAuthSession(refreshed.tokens.accessToken);
        if (cancelled) return;

        setUser(session.user);
      } catch (err) {
        if (__DEV__) {
          console.warn("[U Mind] Session restore failed:", err);
        }
        await secureStorage.clearRefreshToken();
        if (!cancelled) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(user && accessToken),
      user,
      accessToken,
      establishSession,
      clearSession,
    }),
    [isBootstrapping, user, accessToken, establishSession, clearSession],
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
