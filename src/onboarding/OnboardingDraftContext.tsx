import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_AVATAR_ID } from "../avatars/catalog";
import { DEFAULT_ALIAS } from "../utils/aliasSuggestions";
import { deviceTimezone } from "./catalog";
import type {
  AppThemeKey,
  GenderKey,
  LifeStageKey,
  SaathiCheckInModeKey,
  SaathiCheckInSlotId,
  SaathiLanguageKey,
  SaathiTimezoneSourceKey,
  SexualOrientationKey,
  StartingFeelingKey,
  UnwindHabitKey,
} from "./types";

export type OnboardingDraft = {
  alias: string;
  avatarId: string;
  recoveryKeyWords: string[];
  lifeStage: LifeStageKey | null;
  gender: GenderKey | null;
  sexualOrientation: SexualOrientationKey | null;
  startingFeelings: StartingFeelingKey[];
  appTheme: AppThemeKey;
  city: string;
  saathiCheckInMode: SaathiCheckInModeKey | null;
  saathiCheckInSlots: SaathiCheckInSlotId[];
  saathiTimezone: string;
  saathiTimezoneSource: SaathiTimezoneSourceKey;
  unwindHabits: UnwindHabitKey[];
  saathiLanguage: SaathiLanguageKey | null;
  subscriptionPlan: "yearly" | "quarterly" | "monthly";
};

type ContextValue = {
  draft: OnboardingDraft;
  setAlias: (alias: string) => void;
  setAvatarId: (avatarId: string) => void;
  setRecoveryKeyWords: (words: string[]) => void;
  setLifeStage: (lifeStage: LifeStageKey) => void;
  setGender: (gender: GenderKey) => void;
  setSexualOrientation: (value: SexualOrientationKey) => void;
  toggleStartingFeeling: (feeling: StartingFeelingKey) => void;
  setAppTheme: (theme: AppThemeKey) => void;
  setCity: (city: string) => void;
  setSaathiCheckInMode: (mode: SaathiCheckInModeKey) => void;
  toggleCheckInSlot: (slot: SaathiCheckInSlotId) => void;
  setSaathiTimezone: (tz: string, source: SaathiTimezoneSourceKey) => void;
  toggleUnwindHabit: (value: UnwindHabitKey) => void;
  setSaathiLanguage: (value: SaathiLanguageKey) => void;
  setSubscriptionPlan: (plan: OnboardingDraft["subscriptionPlan"]) => void;
  resetDraft: () => void;
};

const defaultDraft: OnboardingDraft = {
  alias: DEFAULT_ALIAS,
  avatarId: DEFAULT_AVATAR_ID,
  recoveryKeyWords: [],
  lifeStage: null,
  gender: null,
  sexualOrientation: null,
  startingFeelings: [],
  appTheme: "LAVENDER",
  city: "Delhi",
  saathiCheckInMode: null,
  saathiCheckInSlots: [],
  saathiTimezone: deviceTimezone(),
  saathiTimezoneSource: "AUTO",
  unwindHabits: [],
  saathiLanguage: null,
  subscriptionPlan: "yearly",
};

const OnboardingDraftContext = createContext<ContextValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  const toggleStartingFeeling = useCallback((feeling: StartingFeelingKey) => {
    setDraft((prev) => {
      const has = prev.startingFeelings.includes(feeling);
      return {
        ...prev,
        startingFeelings: has
          ? prev.startingFeelings.filter((f) => f !== feeling)
          : [...prev.startingFeelings, feeling],
      };
    });
  }, []);

  const toggleUnwindHabit = useCallback((value: UnwindHabitKey) => {
    setDraft((prev) => {
      const has = prev.unwindHabits.includes(value);
      return {
        ...prev,
        unwindHabits: has ? prev.unwindHabits.filter((v) => v !== value) : [...prev.unwindHabits, value],
      };
    });
  }, []);

  const toggleCheckInSlot = useCallback((slot: SaathiCheckInSlotId) => {
    setDraft((prev) => {
      const has = prev.saathiCheckInSlots.includes(slot);
      return {
        ...prev,
        saathiCheckInMode: "SCHEDULED",
        saathiCheckInSlots: has
          ? prev.saathiCheckInSlots.filter((s) => s !== slot)
          : [...prev.saathiCheckInSlots, slot],
      };
    });
  }, []);

  const setSaathiCheckInMode = useCallback((mode: SaathiCheckInModeKey) => {
    setDraft((prev) => ({
      ...prev,
      saathiCheckInMode: mode,
      saathiCheckInSlots: mode === "ONLY_WHEN_OPEN" ? [] : prev.saathiCheckInSlots,
    }));
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      draft,
      setAlias: (alias) => setDraft((prev) => ({ ...prev, alias })),
      setAvatarId: (avatarId) => setDraft((prev) => ({ ...prev, avatarId })),
      setRecoveryKeyWords: (recoveryKeyWords) => setDraft((prev) => ({ ...prev, recoveryKeyWords })),
      setLifeStage: (lifeStage) => setDraft((prev) => ({ ...prev, lifeStage })),
      setGender: (gender) => setDraft((prev) => ({ ...prev, gender })),
      setSexualOrientation: (sexualOrientation) => setDraft((prev) => ({ ...prev, sexualOrientation })),
      toggleStartingFeeling,
      setAppTheme: (appTheme) => setDraft((prev) => ({ ...prev, appTheme })),
      setCity: (city) => setDraft((prev) => ({ ...prev, city })),
      setSaathiCheckInMode,
      toggleCheckInSlot,
      setSaathiTimezone: (saathiTimezone, saathiTimezoneSource) =>
        setDraft((prev) => ({ ...prev, saathiTimezone, saathiTimezoneSource })),
      toggleUnwindHabit,
      setSaathiLanguage: (saathiLanguage) => setDraft((prev) => ({ ...prev, saathiLanguage })),
      setSubscriptionPlan: (subscriptionPlan) => setDraft((prev) => ({ ...prev, subscriptionPlan })),
      resetDraft: () => setDraft({ ...defaultDraft, saathiTimezone: deviceTimezone() }),
    }),
    [draft, toggleStartingFeeling, toggleUnwindHabit, toggleCheckInSlot, setSaathiCheckInMode],
  );

  return <OnboardingDraftContext.Provider value={value}>{children}</OnboardingDraftContext.Provider>;
}

export function useOnboardingDraft(): ContextValue {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) {
    throw new Error("useOnboardingDraft must be used within OnboardingDraftProvider");
  }
  return ctx;
}
