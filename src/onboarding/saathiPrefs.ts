import type { OnboardingDraft } from "./OnboardingDraftContext";
import type { SaathiCheckInKey, SaathiLanguageKey, UnwindHabitKey } from "./types";

const CHECK_IN_BY_LABEL: Record<string, SaathiCheckInKey> = {
  Morning: "MORNING",
  Afternoon: "AFTERNOON",
  Evening: "EVENING",
  "Before bed": "BEFORE_BED",
  "Only when I open it": "ONLY_WHEN_I_OPEN",
};

const UNWIND_BY_LABEL: Record<string, UnwindHabitKey> = {
  Breathing: "BREATHING",
  Walking: "WALKING",
  "Talking it out": "TALKING_IT_OUT",
  "Calm sounds": "CALM_SOUNDS",
  Writing: "WRITING",
  "Ayurveda routines": "AYURVEDA_ROUTINES",
};

const LANGUAGE_BY_LABEL: Record<string, SaathiLanguageKey> = {
  Hindi: "HINDI",
  English: "ENGLISH",
  Hinglish: "HINGLISH",
};

export type SaathiRegisterPrefs = {
  saathiCheckIn: SaathiCheckInKey;
  saathiLanguage: SaathiLanguageKey;
  unwindHabits: UnwindHabitKey[];
};

/** Maps onboarding UI labels to API enum values. Returns null if any required answer is missing or invalid. */
export function saathiPrefsFromDraft(draft: OnboardingDraft): SaathiRegisterPrefs | null {
  if (!draft.saathiCheckIn || !draft.saathiLanguage || draft.unwindHabits.length === 0) {
    return null;
  }

  const saathiCheckIn = CHECK_IN_BY_LABEL[draft.saathiCheckIn];
  const saathiLanguage = LANGUAGE_BY_LABEL[draft.saathiLanguage];
  const unwindHabits = draft.unwindHabits
    .map((label) => UNWIND_BY_LABEL[label])
    .filter((v): v is UnwindHabitKey => v !== undefined);

  if (!saathiCheckIn || !saathiLanguage || unwindHabits.length !== draft.unwindHabits.length) {
    return null;
  }

  return { saathiCheckIn, saathiLanguage, unwindHabits };
}
