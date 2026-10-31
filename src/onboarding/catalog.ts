import options from "./onboarding-options.json";
import type {
  GenderKey,
  LifeStageKey,
  SaathiCheckInModeKey,
  SaathiCheckInSlotId,
  SaathiLanguageKey,
  SexualOrientationKey,
  StartingFeelingKey,
  UnwindHabitKey,
} from "./types";

export const ONBOARDING_OPTIONS = options;

export const GENDER_OPTIONS = options.gender as { id: GenderKey; label: string }[];
export const ORIENTATION_OPTIONS = options.sexualOrientation as { id: SexualOrientationKey; label: string }[];
export const FEELING_OPTIONS = options.startingFeelings as { id: StartingFeelingKey; label: string }[];
export const LANGUAGE_OPTIONS = options.saathiLanguage as { id: SaathiLanguageKey; label: string }[];
export const CHECK_IN_MODE_OPTIONS = options.saathiCheckInMode as { id: SaathiCheckInModeKey; label: string }[];
export const CHECK_IN_SLOT_OPTIONS = options.saathiCheckInSlots as {
  id: SaathiCheckInSlotId;
  label: string;
  group: string;
}[];
export const UNWIND_OPTIONS = options.unwindHabits as {
  id: UnwindHabitKey;
  label: string;
  category: string | null;
}[];

export const LIFE_STAGE_META = options.lifeStage as {
  id: LifeStageKey;
  label: string;
  range: string;
}[];

export function labelForId(map: { id: string; label: string }[], id: string): string {
  return map.find((o) => o.id === id)?.label ?? id;
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const UNWIND_CATEGORIES = [
  "Physical",
  "Mindfulness",
  "Creative",
  "Relaxation",
  "Social",
  "Self-reflection",
  "Practical",
] as const;

export function slotsByGroup(): { group: string; slots: typeof CHECK_IN_SLOT_OPTIONS }[] {
  const order = ["Morning", "Afternoon", "Evening", "Night"];
  return order.map((group) => ({
    group,
    slots: CHECK_IN_SLOT_OPTIONS.filter((s) => s.group === group),
  }));
}
