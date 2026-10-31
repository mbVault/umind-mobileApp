import type { OnboardingDraft } from "./OnboardingDraftContext";
import type { SaathiCheckInModeKey, SaathiCheckInSlotId, SaathiLanguageKey, UnwindHabitKey } from "./types";

export type SaathiRegisterPrefs = {
  saathiCheckInMode: SaathiCheckInModeKey;
  saathiCheckInSlots: SaathiCheckInSlotId[];
  saathiLanguage: SaathiLanguageKey;
  unwindHabits: UnwindHabitKey[];
  saathiTimezone: string;
  saathiTimezoneSource: "AUTO" | "MANUAL";
};

/** Validates Saathi prefs on the draft. Returns null if incomplete. */
export function saathiPrefsFromDraft(draft: OnboardingDraft): SaathiRegisterPrefs | null {
  if (!draft.saathiLanguage || !draft.saathiCheckInMode || draft.unwindHabits.length === 0) {
    return null;
  }
  if (!draft.saathiTimezone.trim()) return null;

  if (draft.saathiCheckInMode === "SCHEDULED" && draft.saathiCheckInSlots.length === 0) {
    return null;
  }
  if (draft.saathiCheckInMode === "ONLY_WHEN_OPEN" && draft.saathiCheckInSlots.length > 0) {
    return null;
  }

  return {
    saathiCheckInMode: draft.saathiCheckInMode,
    saathiCheckInSlots: draft.saathiCheckInMode === "ONLY_WHEN_OPEN" ? [] : draft.saathiCheckInSlots,
    saathiLanguage: draft.saathiLanguage,
    unwindHabits: draft.unwindHabits,
    saathiTimezone: draft.saathiTimezone.trim(),
    saathiTimezoneSource: draft.saathiTimezoneSource,
  };
}
