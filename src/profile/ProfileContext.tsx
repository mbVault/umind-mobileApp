import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProfile, type UserProfile } from "../api/profile";
import { useAuthSession } from "../auth/AuthSessionContext";

type ContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(accessToken);
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [isAuthenticated, accessToken, refreshProfile]);

  const value = useMemo(
    () => ({ profile, loading, error, refreshProfile }),
    [profile, loading, error, refreshProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
