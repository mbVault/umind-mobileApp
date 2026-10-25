import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchStaffMe, StaffMe } from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { initPsychologistSuperTokens, SuperTokens } from "./supertokens";
import { staffApiDomain, STAFF_AUTH_BASE_PATH } from "../config";

type AuthState = {
  ready: boolean;
  isAuthenticated: boolean;
  staff: StaffMe | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<StaffMe | null>;
};

const PsychologistAuthContext = createContext<AuthState | null>(null);

async function emailPasswordSignIn(email: string, password: string): Promise<void> {
  const url = `${staffApiDomain()}${STAFF_AUTH_BASE_PATH}/signin`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      rid: "emailpassword",
    },
    body: JSON.stringify({
      formFields: [
        { id: "email", value: email.trim().toLowerCase() },
        { id: "password", value: password },
      ],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
  };

  if (!response.ok || payload.status !== "OK") {
    throw new StaffApiError(
      response.status || 401,
      payload.message ?? "Invalid email or password"
    );
  }
}

export function PsychologistAuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staff, setStaff] = useState<StaffMe | null>(null);

  useEffect(() => {
    initPsychologistSuperTokens();
    let cancelled = false;

    (async () => {
      try {
        const exists = await SuperTokens.doesSessionExist();
        if (!exists) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setStaff(null);
            setReady(true);
          }
          return;
        }
        const me = await fetchStaffMe();
        if (!cancelled) {
          setStaff(me);
          setIsAuthenticated(true);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setStaff(null);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchStaffMe();
      setStaff(me);
      setIsAuthenticated(true);
      return me;
    } catch {
      setStaff(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await emailPasswordSignIn(email, password);
      const me = await fetchStaffMe();
      if (!me.roles.includes("PSYCHOLOGIST")) {
        await SuperTokens.signOut();
        throw new StaffApiError(403, "This account is not provisioned as a psychologist.");
      }
      setStaff(me);
      setIsAuthenticated(true);
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await SuperTokens.signOut();
    } finally {
      setStaff(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value = useMemo(
    () => ({ ready, isAuthenticated, staff, signIn, signOut, refreshMe }),
    [ready, isAuthenticated, staff, signIn, signOut, refreshMe]
  );

  return (
    <PsychologistAuthContext.Provider value={value}>{children}</PsychologistAuthContext.Provider>
  );
}

export function usePsychologistAuth(): AuthState {
  const ctx = useContext(PsychologistAuthContext);
  if (!ctx) {
    throw new Error("usePsychologistAuth must be used within PsychologistAuthProvider");
  }
  return ctx;
}
