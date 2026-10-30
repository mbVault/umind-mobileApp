import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchStaffAccess,
  PsychologistProfileDto,
  StaffAccessKind,
  StaffMe,
  startOnboardSession,
} from "../api/psychologistApi";
import { StaffApiError } from "../api/staffClient";
import { initPsychologistSuperTokens, SuperTokens } from "./supertokens";
import {
  consumePasswordlessCode,
  createPasswordlessCode,
  emailPasswordSignIn,
  OtpCreateResult,
} from "./staffAuthApi";

type AuthState = {
  ready: boolean;
  isPsychologist: boolean;
  isApplicant: boolean;
  access: StaffAccessKind | null;
  staff: StaffMe | null;
  profile: PsychologistProfileDto | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<OtpCreateResult>;
  requestPhoneOtp: (phoneNumber: string) => Promise<OtpCreateResult>;
  verifyOtpForSignIn: (session: OtpCreateResult, code: string) => Promise<void>;
  verifyOtpForOnboard: (session: OtpCreateResult, code: string) => Promise<void>;
  completeSessionAsPsychologist: () => Promise<void>;
  completeOnboardIdentity: (hint?: { email?: string }) => Promise<void>;
  refreshAccess: () => Promise<StaffAccessKind | null>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  verifyOtp: (session: OtpCreateResult, code: string) => Promise<void>;
  refreshMe: () => Promise<StaffMe | null>;
};

const PsychologistAuthContext = createContext<AuthState | null>(null);

export function PsychologistAuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [access, setAccess] = useState<StaffAccessKind | null>(null);
  const [staff, setStaff] = useState<StaffMe | null>(null);
  const [profile, setProfile] = useState<PsychologistProfileDto | null>(null);

  const applyAccess = useCallback(
    (dto: {
      access: StaffAccessKind;
      staff: StaffMe | null;
      profile: PsychologistProfileDto | null;
    }) => {
      setAccess(dto.access);
      setStaff(dto.staff);
      setProfile(dto.profile);
    },
    []
  );

  const refreshAccess = useCallback(async () => {
    try {
      const exists = await SuperTokens.doesSessionExist();
      if (!exists) {
        setAccess(null);
        setStaff(null);
        setProfile(null);
        return null;
      }
      const dto = await fetchStaffAccess();
      applyAccess(dto);
      return dto.access;
    } catch {
      setAccess(null);
      setStaff(null);
      setProfile(null);
      return null;
    }
  }, [applyAccess]);

  useEffect(() => {
    initPsychologistSuperTokens();
    let cancelled = false;
    (async () => {
      try {
        const exists = await SuperTokens.doesSessionExist();
        if (!exists) {
          if (!cancelled) {
            setAccess(null);
            setStaff(null);
            setProfile(null);
            setReady(true);
          }
          return;
        }
        const dto = await fetchStaffAccess();
        if (!cancelled) {
          applyAccess(dto);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setAccess(null);
          setStaff(null);
          setProfile(null);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyAccess]);

  /**
   * Sign-in completion: keep session for approved psychologists OR returning applicants.
   * Applicants stay APPLICANT — never grant clinic access here.
   */
  const completeSessionAsPsychologist = useCallback(async () => {
    const dto = await fetchStaffAccess();
    const hasPsychRole = Boolean(dto.staff?.roles.includes("PSYCHOLOGIST"));
    const hrApproved = dto.profile?.hrApprovalStatus === "APPROVED";

    if (dto.access === "PSYCHOLOGIST" && hasPsychRole && hrApproved) {
      applyAccess(dto);
      return;
    }

    // Returning applicant (submitted, pending, or rejected) — resume application status.
    if (dto.access === "APPLICANT" && dto.staff && dto.profile) {
      applyAccess(dto);
      return;
    }

    await SuperTokens.signOut();

    if (dto.access === "IDENTITY_ONLY" || !dto.staff) {
      throw new StaffApiError(403, "No account found. Tap Onboard me to apply.");
    }

    throw new StaffApiError(403, "Could not sign in. Tap Onboard me to continue your application.");
  }, [applyAccess]);

  const completeOnboardIdentity = useCallback(
    async (hint?: { email?: string }) => {
      const dto = await startOnboardSession(hint);
      applyAccess(dto);
    },
    [applyAccess]
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      await emailPasswordSignIn(email, password);
      await completeSessionAsPsychologist();
    },
    [completeSessionAsPsychologist]
  );

  const requestEmailOtp = useCallback(async (email: string) => createPasswordlessCode({ email }), []);
  const requestPhoneOtp = useCallback(
    async (phoneNumber: string) => createPasswordlessCode({ phoneNumber }),
    []
  );

  const verifyOtpForSignIn = useCallback(
    async (session: OtpCreateResult, code: string) => {
      await consumePasswordlessCode({
        deviceId: session.deviceId,
        preAuthSessionId: session.preAuthSessionId,
        userInputCode: code,
      });
      await completeSessionAsPsychologist();
    },
    [completeSessionAsPsychologist]
  );

  const verifyOtpForOnboard = useCallback(
    async (session: OtpCreateResult, code: string) => {
      await consumePasswordlessCode({
        deviceId: session.deviceId,
        preAuthSessionId: session.preAuthSessionId,
        userInputCode: code,
      });
      await completeOnboardIdentity({ email: session.email });
    },
    [completeOnboardIdentity]
  );

  const signOut = useCallback(async () => {
    try {
      await SuperTokens.signOut();
    } finally {
      setAccess(null);
      setStaff(null);
      setProfile(null);
    }
  }, []);

  const isPsychologist = access === "PSYCHOLOGIST";
  const isApplicant = access === "APPLICANT" || access === "IDENTITY_ONLY";

  const value = useMemo(
    () => ({
      ready,
      isPsychologist,
      isApplicant,
      access,
      staff,
      profile,
      signInWithPassword,
      requestEmailOtp,
      requestPhoneOtp,
      verifyOtpForSignIn,
      verifyOtpForOnboard,
      completeSessionAsPsychologist,
      completeOnboardIdentity,
      refreshAccess,
      signOut,
      isAuthenticated: isPsychologist || isApplicant,
      signIn: signInWithPassword,
      verifyOtp: verifyOtpForSignIn,
      refreshMe: async () => {
        await refreshAccess();
        return staff;
      },
    }),
    [
      ready,
      isPsychologist,
      isApplicant,
      access,
      staff,
      profile,
      signInWithPassword,
      requestEmailOtp,
      requestPhoneOtp,
      verifyOtpForSignIn,
      verifyOtpForOnboard,
      completeSessionAsPsychologist,
      completeOnboardIdentity,
      refreshAccess,
      signOut,
    ]
  );

  return (
    <PsychologistAuthContext.Provider value={value}>{children}</PsychologistAuthContext.Provider>
  );
}

export function usePsychologistAuth(): AuthState {
  const ctx = useContext(PsychologistAuthContext);
  if (!ctx) throw new Error("usePsychologistAuth must be used within PsychologistAuthProvider");
  return ctx;
}
