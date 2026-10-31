import {
  CHECK_IN_MODE_OPTIONS,
  CHECK_IN_SLOT_OPTIONS,
  FEELING_OPTIONS,
  GENDER_OPTIONS,
  ORIENTATION_OPTIONS,
  labelForId,
} from "../onboarding/catalog";
import { LIFE_STAGE_OPTIONS } from "../onboarding/lifeStageOptions";

export function feelingChipLabel(code: string): string {
  return labelForId(FEELING_OPTIONS, code);
}

export function checkInChipLabel(profile: {
  saathiCheckInMode?: string | null;
  saathiCheckInSlots?: string[];
  saathiCheckIn?: string | null;
}): string {
  if (profile.saathiCheckInMode === "ONLY_WHEN_OPEN") {
    return labelForId(CHECK_IN_MODE_OPTIONS, "ONLY_WHEN_OPEN");
  }
  if (profile.saathiCheckInMode === "SCHEDULED" && profile.saathiCheckInSlots?.length) {
    const first = profile.saathiCheckInSlots[0]!;
    const more = profile.saathiCheckInSlots.length > 1 ? ` +${profile.saathiCheckInSlots.length - 1}` : "";
    return `Check-ins: ${labelForId(CHECK_IN_SLOT_OPTIONS, first)}${more}`;
  }
  // Legacy scalar fallback
  const legacy: Record<string, string> = {
    MORNING: "Check-ins: Morning",
    AFTERNOON: "Check-ins: Afternoon",
    EVENING: "Check-ins: Evening",
    BEFORE_BED: "Check-ins: Before bed",
    ONLY_WHEN_I_OPEN: "Check-ins: When I open",
  };
  return profile.saathiCheckIn ? legacy[profile.saathiCheckIn] ?? profile.saathiCheckIn : "—";
}

export function genderLabel(code: string): string {
  return labelForId(GENDER_OPTIONS, code);
}

export function orientationLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return labelForId(ORIENTATION_OPTIONS, code);
}

export function lifeStageForYouLabel(lifeStage: string): string {
  const opt = LIFE_STAGE_OPTIONS.find((o) => o.key === lifeStage);
  if (!opt) return "For you";
  return `For you · ${opt.title}, ${opt.range}`;
}

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
