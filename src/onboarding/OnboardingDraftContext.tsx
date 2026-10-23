import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_AVATAR_ID } from "../avatars/catalog";
import { DEFAULT_ALIAS } from "../utils/aliasSuggestions";
import type { AppThemeKey, GenderKey, LifeStageKey, StartingFeelingKey } from "./types";

export type OnboardingDraft = {
  alias: string;
  avatarId: string;
  recoveryKeyWords: string[];
  lifeStage: LifeStageKey | null;
  gender: GenderKey | null;
  startingFeelings: StartingFeelingKey[];
  appTheme: AppThemeKey;
  city: string;
  saathiCheckIn: string | null;
  unwindHabits: string[];
  saathiLanguage: string | null;
  subscriptionPlan: "yearly" | "quarterly" | "monthly";
};

type ContextValue = {
  draft: OnboardingDraft;
  setAlias: (alias: string) => void;
  setAvatarId: (avatarId: string) => void;
  setRecoveryKeyWords: (words: string[]) => void;
  setLifeStage: (lifeStage: LifeStageKey) => void;
  setGender: (gender: GenderKey) => void;
  toggleStartingFeeling: (feeling: StartingFeelingKey) => void;
  setAppTheme: (theme: AppThemeKey) => void;
  setCity: (city: string) => void;
  setSaathiCheckIn: (value: string) => void;
  toggleUnwindHabit: (value: string) => void;
  setSaathiLanguage: (value: string) => void;
  setSubscriptionPlan: (plan: OnboardingDraft["subscriptionPlan"]) => void;
  resetDraft: () => void;
};

const defaultDraft: OnboardingDraft = {
  alias: DEFAULT_ALIAS,
  avatarId: DEFAULT_AVATAR_ID,
  recoveryKeyWords: [],
  lifeStage: null,
  gender: null,
  startingFeelings: [],
  appTheme: "LAVENDER",
  city: "Delhi",
  saathiCheckIn: null,
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

  const toggleUnwindHabit = useCallback((value: string) => {
    setDraft((prev) => {
      const has = prev.unwindHabits.includes(value);
      return {
        ...prev,
        unwindHabits: has ? prev.unwindHabits.filter((v) => v !== value) : [...prev.unwindHabits, value],
      };
    });
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      draft,
      setAlias: (alias) => setDraft((prev) => ({ ...prev, alias })),
      setAvatarId: (avatarId) => setDraft((prev) => ({ ...prev, avatarId })),
      setRecoveryKeyWords: (recoveryKeyWords) => setDraft((prev) => ({ ...prev, recoveryKeyWords })),
      setLifeStage: (lifeStage) => setDraft((prev) => ({ ...prev, lifeStage })),
      setGender: (gender) => setDraft((prev) => ({ ...prev, gender })),
      toggleStartingFeeling,
      setAppTheme: (appTheme) => setDraft((prev) => ({ ...prev, appTheme })),
      setCity: (city) => setDraft((prev) => ({ ...prev, city })),
      setSaathiCheckIn: (saathiCheckIn) => setDraft((prev) => ({ ...prev, saathiCheckIn })),
      toggleUnwindHabit,
      setSaathiLanguage: (saathiLanguage) => setDraft((prev) => ({ ...prev, saathiLanguage })),
      setSubscriptionPlan: (subscriptionPlan) => setDraft((prev) => ({ ...prev, subscriptionPlan })),
      resetDraft: () => setDraft(defaultDraft),
    }),
    [draft, toggleStartingFeeling, toggleUnwindHabit],
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
